import { createClient } from '@supabase/supabase-js';

// Lấy thông tin từ biến môi trường (sẽ cấu hình sau)
const supabaseUrl = "https://egamzsfcrwmkvttgnkhl.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnYW16c2Zjcndta3Z0dGdua2hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2MTY2NDcsImV4cCI6MjA1NzE5MjY0N30.PrSacIOoLDHpc52ECZTCd_57EzlSHnKAmtHLp38WIBk";

// Khởi tạo client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);