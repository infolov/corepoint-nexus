import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    if (!RESEND_API_KEY) {
      console.log('RESEND_API_KEY not configured - skipping email send');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email service not configured. Please add RESEND_API_KEY.',
          skipped: true 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { email, password, fullName, companyName } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
          .credential-row { margin: 10px 0; }
          .label { font-weight: bold; color: #6b7280; }
          .value { font-family: monospace; background: #f3f4f6; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 5px; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Witamy w programie Partnerskim!</h1>
          </div>
          <div class="content">
            <p>Cześć${fullName ? ` <strong>${fullName}</strong>` : ''},</p>
            <p>Twoje konto Partnera zostało utworzone${companyName ? ` dla firmy <strong>${companyName}</strong>` : ''}. Poniżej znajdziesz dane do logowania:</p>
            
            <div class="credentials">
              <div class="credential-row">
                <div class="label">Email:</div>
                <div class="value">${email}</div>
              </div>
              <div class="credential-row">
                <div class="label">Hasło:</div>
                <div class="value">${password}</div>
              </div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Ważne:</strong> Ze względów bezpieczeństwa zalecamy zmianę hasła po pierwszym logowaniu.
            </div>
            
            <p>Po zalogowaniu uzyskasz dostęp do Panelu Partnera, gdzie możesz:</p>
            <ul>
              <li>Tworzyć i zarządzać kampaniami reklamowymi</li>
              <li>Śledzić statystyki swoich kampanii</li>
              <li>Zarządzać kredytami reklamowymi</li>
            </ul>
            
            <p>W razie pytań skontaktuj się z nami.</p>
            
            <p>Pozdrawiamy,<br>Zespół</p>
          </div>
          <div class="footer">
            <p>Ta wiadomość została wygenerowana automatycznie.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Portal Informacyjny <noreply@resend.dev>',
        to: [email],
        subject: 'Witamy w programie Partnerskim - Dane logowania',
        html: emailHtml,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Resend API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.message || 'Failed to send email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, messageId: data.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending welcome email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
