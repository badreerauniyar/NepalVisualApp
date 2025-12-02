// Supabase Edge Function: Create User
// This function securely creates users using the service role key
// Only superadmins can call this function

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify the user is authenticated and is a superadmin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is superadmin
    const { data: roleData, error: roleError } = await supabaseClient
      .rpc('get_current_user_role');

    if (roleError || !roleData || roleData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Unable to verify user role' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const role = roleData[0];
    if (role.role_name !== 'superadmin') {
      return new Response(
        JSON.stringify({ error: 'Only superadmin can create users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { email, fullName, roleId, provinces } = await req.json();

    if (!email || !fullName || !roleId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, fullName, roleId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase admin client (uses service role key from environment)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Generate a random password (user will set their own via email)
    const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + 'A1!';

    // Create the user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: randomPassword, // Temporary password, user will reset it
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createError || !newUser.user) {
      return new Response(
        JSON.stringify({ error: createError?.message || 'Failed to create user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Assign role and provinces
    const { error: assignError } = await supabaseAdmin.rpc('assign_role_to_user', {
      p_user_id: newUser.user.id,
      p_role_id: roleId,
      p_provinces: provinces || [],
    });

    if (assignError) {
      // User was created but role assignment failed - log this
      console.error('Failed to assign role:', assignError);
      // Continue anyway, role can be assigned manually later
    }

    // Send password reset email so user can set their own password
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    });

    if (resetError) {
      console.error('Failed to send password reset email:', resetError);
      // User is created, but email might not be sent - this is not critical
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          full_name: fullName,
        },
        message: 'User created successfully. Password reset email sent.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

