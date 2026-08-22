# Piattaforma BIVA — Fase 1 (MVP)

## Stato attuale

**Fatto e verificato:**
- `lib/biva-engine.ts` — motore di calcolo completo: normalizzazione R/H·Xc/H,
  angolo di fase, geometria delle ellissi di tolleranza/confidenza,
  Z-score bivariato, classificazione a 7 zone (pattern Piccoli), migrazione
  vettoriale per il follow-up. Le formule geometriche sono tradotte
  letteralmente dalla fonte primaria (Piccoli & Pastori, *BIVA software*,
  Univ. di Padova, 2002, Eq. 1a/2a) e testate numericamente contro il limite
  asintotico noto (chi-quadro a 2 gradi di libertà).
- `prisma/schema.prisma` — schema del database per Neon: `Patient`,
  `Measurement`, `ReferencePopulation`, `User`. Nessun valore numerico di
  popolazione è precaricato: vanno inseriti da tabelle pubblicate.
- Prototipo interattivo del grafico RXc (artifact separato) per validazione
  visiva della geometria — con dati di popolazione **di esempio**, non reali.

**Manca — blocco prima di procedere:**
I parametri numerici reali (media R/H, media Xc/H, SD, r) delle popolazioni
di riferimento — Piccoli 1995 (Am J Clin Nutr 61:269-270) e Campa 2023
(Clin Nutr 42:1749-58) — non sono stati reperibili da fonti ad accesso
aperto: sono tabelle dentro paper paywalled, non riprodotte negli
abstract/snippet disponibili via ricerca web. Senza questi numeri le
ellissi non possono rappresentare popolazioni reali.

Opzioni per sbloccare:
1. Se hai accesso istituzionale a PubMed/Clinical Nutrition/Am J Clin Nutr,
   recuperare le tabelle esatte (in genere Table 1/2 del paper).
2. Usare il software originale BIVAtolerance.xls di Piccoli (se disponibile),
   che ha le popolazioni di riferimento precaricate nel foglio
   "Reference populations".
3. Procedere con altre popolazioni per cui i dati numerici sono più
   accessibili (da verificare caso per caso).

## Struttura

```
biva-app/
├── lib/
│   └── biva-engine.ts       # motore di calcolo (verificato)
├── prisma/
│   └── schema.prisma        # schema DB Neon
├── package.json
└── README.md
```

## Prossimi passi (dopo aver sbloccato i dati di riferimento)

1. Popolare `ReferencePopulation` con i valori verificati
2. Costruire le pagine Next.js (dashboard pazienti, form misurazione, grafico RXc)
3. Collegare Neon (connection string in `.env`)
4. Push su GitHub, collegare a Vercel per il deploy
