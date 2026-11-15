// Les actions d'authentification fonctionnent dès que supabase/config.js est renseigné.
const cfg = window.SUPABASE_CONFIG || {};
const client = (window.supabase && cfg.url && cfg.anonKey) ? window.supabase.createClient(cfg.url,cfg.anonKey) : null;
async function emailAuth(mode){
 const msg=document.getElementById('authmsg'), email=document.getElementById('email').value.trim(), password=document.getElementById('password').value;
 if(!client){msg.textContent="Configuration Supabase manquante : renseignez supabase/config.js.";return}
 if(!email||password.length<8){msg.textContent="Saisissez un e-mail et un mot de passe d'au moins 8 caractères.";return}
 const result=mode==='signup'?await client.auth.signUp({email,password}):await client.auth.signInWithPassword({email,password});
 msg.textContent=result.error?result.error.message:(mode==='signup'?"Compte créé. Vérifiez votre e-mail si la confirmation est activée.":"Connexion réussie.");
}
async function socialAuth(provider){
 const msg=document.getElementById('authmsg');
 if(!client){msg.textContent="Configuration Supabase manquante : renseignez supabase/config.js.";return}
 const {error}=await client.auth.signInWithOAuth({provider,options:{redirectTo:location.href}});
 if(error)msg.textContent=error.message;
}
