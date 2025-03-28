const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env file
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase URL or Key is missing. Check your .env file.");
} else {
  console.log("Supabase URL and Key loaded successfully.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("Supabase client initialized.");

module.exports = { supabase };