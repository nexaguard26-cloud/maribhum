import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'marib-humanitarian-secret-key-2024',
    expiresIn: '7d',
  },
  
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    adminIds: process.env.ADMIN_IDS?.split(',').map(id => parseInt(id.trim())) || [],
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
};
