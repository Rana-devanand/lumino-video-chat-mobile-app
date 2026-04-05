import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

serve(async (req) => {
  const jsonBody = await req.json();
  const { record } = jsonBody;

  // 1. Initialize Supabase Admin Client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );

  const { sender_id, receiver_id, content } = record;

  // 2. Fetch Receiver's Push Token
  const { data: receiverData, error: receiverError } = await supabase
    .from('profiles')
    .select('expo_push_token')
    .eq('id', receiver_id)
    .single();

  // 3. Fetch Sender's Name
  const { data: senderData, error: senderError } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', sender_id)
    .single();

  if (receiverError || !receiverData?.expo_push_token) {
    console.error("Recipient has no push token or error fetching:", receiverError);
    return new Response(JSON.stringify({ status: 'No Token' }), { status: 200 });
  }

  // 4. Send notification to Expo
  const message = {
    to: receiverData.expo_push_token,
    sound: 'default',
    title: senderData?.full_name || 'New Message',
    body: content,
    data: { senderId: sender_id, type: 'chat' },
  };

  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });

  const result = await response.json();
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
