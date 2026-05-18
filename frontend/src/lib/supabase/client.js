"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseClient = void 0;
exports.requireSupabaseClient = requireSupabaseClient;
console.log("SUPABASE URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("SUPABASE KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY);
var supabase_js_1 = require("@supabase/supabase-js");
var supabaseUrl = (_a = import.meta.env.VITE_SUPABASE_URL) === null || _a === void 0 ? void 0 : _a.trim();
var supabaseAnonKey = (_b = import.meta.env.VITE_SUPABASE_ANON_KEY) === null || _b === void 0 ? void 0 : _b.trim();
if (!supabaseUrl || !supabaseAnonKey) {
    // Keep runtime throw explicit for misconfigured deployments.
    // This file intentionally never accepts a service role key.
    // eslint-disable-next-line no-console
    console.warn('[auth] Supabase browser client is not configured.');
}
exports.supabaseClient = supabaseUrl && supabaseAnonKey
    ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            flowType: 'pkce',
        },
    })
    : null;
function requireSupabaseClient() {
    if (!exports.supabaseClient) {
        throw new Error('Supabase client is not configured.');
    }
    return exports.supabaseClient;
}
