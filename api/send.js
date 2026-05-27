// api/send.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { to, subject, html, invoiceId } = req.body;

        const data = await resend.emails.send({
            // This MUST be a domain you have verified in the Resend dashboard
            from: 'Reminders <noreply@maxi.maxcredible.com>', 
            to: [to],
            subject: subject,
            html: html
        });

        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("Resend Error:", error);
        res.status(400).json({ error: error.message });
    }
}