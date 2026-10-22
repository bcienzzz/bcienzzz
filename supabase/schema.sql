-- Schema del database Supabase per i dati MIMIT.
-- Da eseguire una volta: Supabase → SQL Editor → incolla tutto → Run.
-- Le tabelle per le segnalazioni degli utenti arriveranno nello step 4.

create table if not exists distributori (
  id              integer primary key,          -- idImpianto MIMIT
  gestore         text not null,
  bandiera        text not null,
  tipo            text not null,                -- Stradale / Autostradale
  nome            text not null,
  indirizzo       text not null,
  comune          text not null,
  provincia       text not null,
  lat             double precision,
  lon             double precision,
  coordinate      text not null,                -- ok, invertite, mancanti, fuori_provincia, lontane_dal_comune
  zone            text[] not null default '{}',
  attivo          boolean not null default true, -- false se sparito dall'ultimo file MIMIT
  data_estrazione date not null
);
create index if not exists distributori_provincia_idx on distributori (provincia);
create index if not exists distributori_zone_idx on distributori using gin (zone);

create table if not exists prezzi (
  distributore_id integer not null references distributori (id) on delete cascade,
  carburante      text not null,                -- nome MIMIT, es. "Blue Diesel"
  famiglia        text not null,                -- benzina, gasolio, gpl, metano, altro
  base            boolean not null,             -- true per il carburante base della famiglia
  self            boolean not null,
  prezzo          numeric(6, 3) not null,
  comunicato_il   timestamptz not null,
  vecchio         boolean not null,
  sospetto        boolean not null,
  data_estrazione date not null,
  primary key (distributore_id, carburante, self)
);
create index if not exists prezzi_famiglia_idx on prezzi (famiglia, self);

create table if not exists importazioni (
  id              bigint generated always as identity primary key,
  data_estrazione date not null,
  province        text[] not null,
  eseguita_il     timestamptz not null default now(),
  report          jsonb not null
);

-- Sicurezza: chiunque può LEGGERE, solo lo script di importazione
-- (che usa la chiave "service_role", mai esposta nel browser) può SCRIVERE.
alter table distributori enable row level security;
alter table prezzi enable row level security;
alter table importazioni enable row level security;

drop policy if exists "lettura pubblica" on distributori;
create policy "lettura pubblica" on distributori for select using (true);
drop policy if exists "lettura pubblica" on prezzi;
create policy "lettura pubblica" on prezzi for select using (true);
drop policy if exists "lettura pubblica" on importazioni;
create policy "lettura pubblica" on importazioni for select using (true);
