import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kgvnmkelsxlkewamrozx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtndm5ta2Vsc3hsa2V3YW1yb3p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3OTUyMTMsImV4cCI6MjEwMDM3MTIxM30.7U3Du3yC8JtDq_jsNSsp_SvgsHMkBCXbll41v8bvWEE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignUp() {
  console.log("Testing sign up...");
  const { data, error } = await supabase.auth.signUp({
    email: 'titrapranav@gmail.com',
    password: 'password1234',
    options: {
      data: {
        full_name: 'Pranav',
        role: 'receptionist',
      },
    },
  });

  if (error) {
    console.log("Error:", error);
    console.log("Error type:", typeof error);
    console.log("Error keys:", Object.keys(error));
    console.log("Error properties:");
    for (const key in error) {
      console.log(`  ${key}:`, error[key]);
    }
    console.log("Error.message:", error.message);
    console.log("Error.message type:", typeof error.message);
  } else {
    console.log("Success:", data);
  }
}

testSignUp();
