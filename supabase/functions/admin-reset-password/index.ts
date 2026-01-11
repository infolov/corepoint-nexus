import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser } } = await supabaseAdmin.auth.getUser(token);
    
    if (!requestingUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if requesting user is admin
    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .eq('role', 'admin')
      .single();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId, newPassword, sendEmail, userEmail, userName } = await req.json();

    if (!userId || !newPassword) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ success: false, error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update user password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let emailSent = false;
    let emailSkipped = false;

    // Send email with new password if requested
    if (sendEmail && userEmail) {
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      
      if (!RESEND_API_KEY) {
        console.log('RESEND_API_KEY not configured - skipping email send');
        emailSkipped = true;
      } else {
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
                <h1>Twoje hasło zostało zmienione</h1>
              </div>
              <div class="content">
                <p>Cześć${userName ? ` <strong>${userName}</strong>` : ''},</p>
                <p>Administrator zmienił Twoje hasło. Poniżej znajdziesz nowe dane do logowania:</p>
                
                <div class="credentials">
                  <div class="credential-row">
                    <div class="label">Email:</div>
                    <div class="value">${userEmail}</div>
                  </div>
                  <div class="credential-row">
                    <div class="label">Nowe hasło:</div>
                    <div class="value">${newPassword}</div>
                  </div>
                </div>
                
                <div class="warning">
                  <strong>⚠️ Ważne:</strong> Ze względów bezpieczeństwa zalecamy zmianę hasła po zalogowaniu.
                </div>
                
                <p>Jeśli nie prosiłeś o zmianę hasła, skontaktuj się z nami natychmiast.</p>
                
                <p>Pozdrawiamy,<br>Zespół</p>
              </div>
              <div class="footer">
                <p>Ta wiadomość została wygenerowana automatycznie.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: 'Portal Informacyjny <noreply@resend.dev>',
              to: [userEmail],
              subject: 'Twoje hasło zostało zmienione',
              html: emailHtml,
            }),
          });

          const data = await res.json();
          
          if (res.ok) {
            emailSent = true;
          } else {
            console.error('Resend API error:', data);
          }
        } catch (emailError) {
          console.error('Error sending email:', emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailSent,
        emailSkipped 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error resetting password:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
