# Partager des chansons avec Supabase

Sans cette étape, le site fonctionne déjà : chacun enregistre ses chansons dans son navigateur.
Avec Supabase, tu peux en plus publier des chansons que **tous les visiteurs** voient, en te connectant sur le site avec ton compte.

## 1. Créer le projet

1. Crée un compte sur https://supabase.com puis un projet (l'offre gratuite suffit).
2. Ouvre **SQL Editor**, colle le script ci-dessous en remplaçant `TON_EMAIL` (deux fois) par l'adresse avec laquelle tu te connecteras, puis **Run**.

```sql
create table public.songs (
  id         text primary key,
  title      text not null,
  artist     text default '',
  folder     text default '',
  yt         text default '',
  song_key   smallint,
  minor      boolean default false,
  body       text not null,
  updated_at timestamptz default now()
);

alter table public.songs enable row level security;

-- tout le monde peut lire
create policy "lecture publique" on public.songs
  for select to anon, authenticated using (true);

-- seul ton compte peut ajouter, modifier, supprimer
create policy "ecriture reservee" on public.songs
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'TON_EMAIL')
  with check ((auth.jwt() ->> 'email') = 'TON_EMAIL');

grant select on public.songs to anon;
grant select, insert, update, delete on public.songs to authenticated;
```

## 2. Créer ton compte administrateur

1. **Authentication → Users → Add user → Create new user** : ton adresse (la même que dans le script) et un mot de passe. Coche « Auto Confirm User ».
2. Conseillé : **Authentication → Sign In / Providers**, désactive « Allow new users to sign up ». Même si quelqu'un créait un compte, la règle ci-dessus l'empêcherait d'écrire, mais autant fermer la porte.

## 3. Relier le site

1. **Project Settings → API** (ou **API Keys**) : copie l'URL du projet et la clé **publishable** (`sb_publishable_…`) ou, sur un ancien projet, la clé **anon**.
2. Colle-les dans `js/config.js`, puis pousse le dépôt.

Cette clé est conçue pour être visible dans le code d'un site : elle ne donne que les droits définis par les règles de l'étape 1. La clé **secret** (ou `service_role`), elle, ne doit jamais apparaître dans le dépôt.

## 4. Utiliser

- Sur la page **Chansons**, en bas de l'en-tête : « Espace administrateur ». Connecte-toi.
- Une fois connecté, « Ajouter une chanson » enregistre par défaut **en ligne, pour tout le monde**. Tu peux aussi publier d'un coup les chansons déjà enregistrées sur ton appareil.
- Les visiteurs voient tes chansons, peuvent les transposer, et peuvent en faire une copie personnelle modifiable (enregistrée chez eux seulement).

## À savoir

- Ce que tu publies est lisible par n'importe qui connaît l'adresse du site : n'y mets que des textes que tu as le droit de diffuser.
- Les projets gratuits Supabase sont mis en pause après une période sans activité ; il suffit de les réactiver depuis le tableau de bord. En attendant, le site affiche la dernière copie connue des chansons.
