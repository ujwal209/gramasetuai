import os
import smtplib
import asyncio
import logging
from typing import Optional, Dict, Any, List
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """
    Transactional Email Service for GramSetu AI.
    Sends 6-digit OTP verification codes and password reset links via SMTP.
    """

    def __init__(self):
        self.smtp_host = settings.SMTP_HOST or "smtp.gmail.com"
        self.smtp_port = settings.SMTP_PORT or 465
        self.sender_email = (
            os.environ.get("EMAIL") or settings.EMAIL or "easynetcraft@gmail.com"
        ).strip()
        self.app_password = (
            os.environ.get("APP_PASSWORD") or settings.APP_PASSWORD or "wkzcpziaujpelmws"
        ).strip()

    def _build_otp_html(self, name: str, otp: str, purpose: str = "verification") -> str:
        headline = "Verify Your GramSetu Farmer Account" if purpose == "verification" else "Reset Your GramSetu Password"
        action_text = "use the following 6-digit one-time password (OTP) to complete your account verification:" if purpose == "verification" else "use this 6-digit OTP to reset your account password:"

        return f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>GramSetu AI - Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #121212; border-radius: 24px; border: 1px solid #27272a; overflow: hidden; max-width: 600px; width: 100%;">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 36px 40px; background: linear-gradient(135deg, #1e8c78 0%, #164e43 100%); text-align: left;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                      GRAMSETU<span style="color: #c5fcee;">.AI</span>
                    </h1>
                    <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 600; color: #c5fcee; letter-spacing: 2px; text-transform: uppercase;">
                      National Civic &amp; Farmer Media Network
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 40px; text-align: left;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff;">
                Namaste, {name}!
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #a1a1aa;">
                Welcome to GramSetu AI. To {action_text}
              </p>

              <!-- OTP Code Display Card -->
              <div style="background-color: #18181b; border: 1px solid #3f3f46; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 11px; font-weight: 700; color: #5ec2ac; letter-spacing: 1.5px; text-transform: uppercase; display: block; margin-bottom: 8px;">
                  Your 6-Digit One-Time Code
                </span>
                <span style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #5ec2ac; font-family: monospace; display: inline-block;">
                  {otp}
                </span>
                <p style="margin: 8px 0 0 0; font-size: 11px; color: #71717a;">
                  Valid for 10 minutes. Please do not share this OTP with anyone.
                </p>
              </div>

              <p style="margin: 0 0 8px 0; font-size: 12px; color: #71717a; line-height: 1.5;">
                If you did not request this verification, please safely ignore this email. No changes will be made to your account.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #18181b; border-top: 1px solid #27272a; text-align: left; font-size: 11px; color: #71717a;">
              <p style="margin: 0 0 4px 0;">
                © 2026 GramSetu AI • Citizen Welfare &amp; Farmer Media Network
              </p>
              <p style="margin: 0;">
                Direct Government Scheme Access • Zero Intermediary Platform
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    def _send_smtp_sync(self, to_email: str, subject: str, html_body: str) -> bool:
        """
        Synchronous SMTP execution designed to run in background thread pool.
        """
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"GramSetu AI <{self.sender_email}>"
            msg["To"] = to_email

            part = MIMEText(html_body, "html")
            msg.attach(part)

            # Connect via SSL or TLS
            if self.smtp_port == 465:
                with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, timeout=15) as server:
                    server.login(self.sender_email, self.app_password)
                    server.sendmail(self.sender_email, [to_email], msg.as_string())
            else:
                with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=15) as server:
                    server.starttls()
                    server.login(self.sender_email, self.app_password)
                    server.sendmail(self.sender_email, [to_email], msg.as_string())

            logger.info(f"Verification email successfully sent to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False

    async def send_otp_email(
        self,
        to_email: str,
        name: str,
        otp: str,
        purpose: str = "verification"
    ) -> bool:
        """
        Asynchronously sends a 6-digit OTP verification or password reset email.
        """
        if not to_email:
            return False

        subject = (
            f"Your GramSetu AI Verification Code: {otp}"
            if purpose == "verification"
            else f"GramSetu AI Password Reset Code: {otp}"
        )
        html_body = self._build_otp_html(name=name, otp=otp, purpose=purpose)
        return await asyncio.to_thread(self._send_smtp_sync, to_email, subject, html_body)

    def _build_notification_html(
        self,
        recipient_name: str,
        title: str,
        headline: str,
        body_text: str,
        action_url: str,
        action_label: str = "View on Kisan Chaupal"
    ) -> str:
        return f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #121212; border-radius: 20px; border: 1px solid #27272a; overflow: hidden; max-width: 600px; width: 100%;">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 28px 36px; background: linear-gradient(135deg, #10b981 0%, #064e3b 100%); text-align: left;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                KISAN CHAUPAL <span style="color: #a7f3d0; font-size: 14px;">• GramSetu Alert</span>
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 36px; text-align: left;">
              <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #ffffff;">
                Namaste {recipient_name},
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #d1d5db;">
                {headline}
              </p>

              <!-- Notification Card -->
              <div style="background-color: #18181b; border: 1px solid #3f3f46; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; color: #f3f4f6; line-height: 1.5; font-style: italic;">
                  "{body_text}"
                </p>
              </div>

              <!-- Action CTA -->
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="{action_url}" style="display: inline-block; background-color: #10b981; color: #ffffff; font-size: 13px; font-weight: 700; padding: 12px 28px; border-radius: 10px; text-decoration: none;">
                  {action_label} →
                </a>
              </div>

              <p style="margin: 0; font-size: 11px; color: #6b7280; line-height: 1.5;">
                You are receiving this notification because of activity on your Kisan Chaupal social profile.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px; background-color: #18181b; border-top: 1px solid #27272a; text-align: left; font-size: 11px; color: #6b7280;">
              © 2026 GramSetu AI • National Civic & Farmer Network
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    async def send_chaupal_notification_email(
        self,
        to_email: str,
        recipient_name: str,
        event_type: str,
        actor_name: str,
        body_text: str = "",
        action_url: Optional[str] = None
    ) -> bool:
        """
        Asynchronously sends social activity notification email (Follow, Like, Comment, DM, Marketplace).
        """
        if not to_email:
            return False

        frontend_base = os.getenv("FRONTEND_URL", "https://gramsetu-ai.vercel.app").rstrip("/")
        if not action_url:
            action_url = f"{frontend_base}/dashboard/chaupal"
        elif action_url.startswith("http://localhost:3000"):
            action_url = action_url.replace("http://localhost:3000", frontend_base)

        if event_type == "follow":
            subject = f"{actor_name} started following you on Kisan Chaupal"
            headline = f"<strong>{actor_name}</strong> is now following your farming updates and harvests."
            action_label = "View Profile"
        elif event_type == "like":
            subject = f"{actor_name} liked your post on Kisan Chaupal"
            headline = f"<strong>{actor_name}</strong> just liked your post on Kisan Chaupal."
            action_label = "View Post"
        elif event_type == "comment":
            subject = f"{actor_name} commented on your post"
            headline = f"<strong>{actor_name}</strong> left a comment on your update."
            action_label = "Reply to Comment"
        elif event_type == "message":
            subject = f"Direct message from {actor_name}"
            headline = f"<strong>{actor_name}</strong> sent you a new direct message."
            action_label = "Open Chat Inbox"
        elif event_type == "marketplace":
            subject = f"Inquiry about your produce from {actor_name}"
            headline = f"<strong>{actor_name}</strong> contacted you regarding your Krishi Mandi listing."
            action_label = "View Marketplace"
        else:
            subject = f"Notification from {actor_name} on Kisan Chaupal"
            headline = f"New activity from {actor_name}."
            action_label = "View Notification"

        html_body = self._build_notification_html(
            recipient_name=recipient_name,
            title=subject,
            headline=headline,
            body_text=body_text or headline,
            action_url=action_url,
            action_label=action_label
        )

        return await asyncio.to_thread(self._send_smtp_sync, to_email, subject, html_body)


email_service = EmailService()
