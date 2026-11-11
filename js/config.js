/* Douze — connexion à Supabase (facultative).
   Renseigne les deux valeurs ci-dessous pour partager des chansons avec tous les visiteurs.
   Elles se trouvent dans ton projet Supabase : Project Settings → API (ou « API Keys »).
   La clé « publishable » (ou « anon ») est faite pour être publique : elle ne donne que les droits
   accordés par les règles de la table (lecture pour tous, écriture pour ton compte seulement).
   N'y mets JAMAIS la clé « secret » / « service_role ». Voir SUPABASE.md. */
window.DOUZE_CONFIG = window.DOUZE_CONFIG || {
  supabaseUrl: 'https://baujbjerqirzbkeavaba.supabase.co',   // exemple : 'https://abcdefghijklmnop.supabase.co'
  supabaseKey: 'sb_publishable_svUFSVb2_6g8719DbJKbhQ_clIATSbo',   // exemple : 'sb_publishable_…' (ou l'ancienne clé « anon » qui commence par eyJ…)
};