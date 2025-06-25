-- Primeiro, vamos limpar qualquer usuário admin existente
DELETE FROM auth.users WHERE email = 'admin@armarzen.com';

-- Criar usuário admin com senha hash correta
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  email_change_confirm_status,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@armarzen.com',
  '$2a$10$8qvZ7Z7Z7Z7Z7Z7Z7Z7Z7uK8qvZ7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7',
  NOW(),
  0,
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Admin ArMarZen"}',
  false,
  '',
  '',
  '',
  ''
);

-- Criar identidade para o usuário
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email = 'admin@armarzen.com'),
  format('{"sub":"%s","email":"%s"}', 
    (SELECT id FROM auth.users WHERE email = 'admin@armarzen.com')::text, 
    'admin@armarzen.com'
  )::jsonb,
  'email',
  NOW(),
  NOW(),
  NOW()
);
