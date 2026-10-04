import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "CampusCarry",
      link: "https://campuscarry.com",
    },
  });

  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);

  const emailHtml = mailGenerator.generate(options.mailgenContent);

  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMTP_HOST,
    port: process.env.MAILTRAP_SMTP_PORT,
    auth: {
      user: process.env.MAILTRAP_SMTP_USER,
      pass: process.env.MAILTRAP_SMTP_PASS,
    },
  });

  const mail = {
    from: "CampusCarry <241210094@gmail.com>",
    to: options.email,
    subject: options.subject,
    text: emailTextual,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.error(
      "Email service failed. Make sure MAILTRAP credentials are set in .env file",
    );
    console.error("Error: ", error);
  }
};

const emailVerificationMailgenContent = (username, verificationUrl) => {
  return {
    body: {
      name: username,
      intro: "Welcome to CampusCarry! Your campus delivery management system.",
      action: {
        instructions:
          "To verify your email and activate your CampusCarry account, click the button below.",
        button: {
          color: "#22BC66",
          text: "Verify Email",
          link: verificationUrl,
        },
      },
      outro:
        "If you did not create this account, please ignore this email. For any help, contact CampusCarry support.",
    },
  };
};

const forgotPasswordMailgenContent = (username, passwordResetUrl) => {
  return {
    body: {
      name: username,
      intro:
        "We received a request to reset the password for your CampusCarry account.",
      action: {
        instructions: "To reset your password, click the button below.",
        button: {
          color: "#22BC66",
          text: "Reset Password",
          link: passwordResetUrl,
        },
      },
      outro:
        "If you did not request a password reset, you can safely ignore this email.",
    },
  };
};

export {
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  sendEmail,
};
