"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
exports.isSupabaseConfigured = isSupabaseConfigured;
var supabase_js_1 = require("@supabase/supabase-js");
var url = (_a = import.meta.env.VITE_SUPABASE_URL) === null || _a === void 0 ? void 0 : _a.trim();
var anonKey = (_b = import.meta.env.VITE_SUPABASE_ANON_KEY) === null || _b === void 0 ? void 0 : _b.trim();
function isSupabaseConfigured() {
    return Boolean(url && anonKey);
}
exports.supabase = url && anonKey
    ? (0, supabase_js_1.createClient)(url, anonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            /** Query `code=` survives apex↔www redirects; implicit `#access_token` often does not. */
            flowType: 'pkce',
        },
    })
    : null;
