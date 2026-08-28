import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

def send_otp_email(to_email: str, otp: str) -> bool:
    """
    Sends an OTP email using Gmail SMTP.
    Returns True if successful, False otherwise.
    """
    sender_email = settings.SMTP_USERNAME
    sender_password = settings.SMTP_PASSWORD
    
    if not sender_email or not sender_password or sender_password == "YOUR_GOOGLE_APP_PASSWORD_HERE":
        print("[EMAIL MOCK] Missing SMTP configuration. Cannot send real email.")
        return False
        
    subject = "Your Artisan-AI Verification Code"
    body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <div style="max-width: 500px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px;">
            <h2 style="color: #2F855A; text-align: center;">Artisan-AI Verification</h2>
            <p>Hello,</p>
            <p>Your one-time verification code is:</p>
            <h1 style="text-align: center; letter-spacing: 5px; color: #2F855A; background: #F0FFF4; padding: 15px; border-radius: 5px;">{otp}</h1>
            <p>This code is valid for 10 minutes. Please do not share this code with anyone.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #888;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      </body>
    </html>
    """
    
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Artisan-AI <{sender_email}>"
    msg["To"] = to_email
    
    msg.attach(MIMEText(body, "html"))
    
    try:
        # Connect to Gmail SMTP server
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, to_email, msg.as_string())
        server.quit()
        print(f"[EMAIL SUCCESS] OTP sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send email to {to_email}: {e}")
        return False
