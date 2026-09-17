# BIVA Platform — Controllo incrociato delle formule

Documento di audit di tutte le equazioni attualmente in uso nel motore di calcolo (`lib/biva-engine.ts`) e nei range di riferimento (`lib/reference-ranges.ts`), verificate contro il codice sorgente reale al commit `13297e5` (25 agosto 2026).

**Nota metodologica generale**: il vettore BIVA (R/H, Xc/H e le ellissi di tolleranza) è posizionamento statistico puro, senza equazioni predittive. Tutto il resto (TBW, ECW, ICW, FFM, FM, BCM, BMI) sono stime da equazioni di regressione pubblicate — un metodo concettualmente diverso, con un proprio errore di stima intrinseco.

---

## 1. Vettore BIVA — nessuna equazione predittiva

### 1.1 BIVA classica
```
x = R / H     y = Xc / H          (Ω/m)
```
**Fonte**: Piccoli A, Rossi B, Pillon L, Bucciante G. "A new method for monitoring body fluid variation by bioimpedance analysis: the RXc graph." *Kidney Int.* 1994;46:534-539.

### 1.2 BIVA specifica (opzionale, richiede 3 circonferenze)
```
Area segmento (cm²) = circonferenza² / (4π)
A totale (cm²) = 0.45·area_braccio + 0.10·area_vita + 0.45·area_polpaccio
L effettiva (cm) = 1.1 × statura
Rsp = R × (A/L)     Xcsp = Xc × (A/L)          (Ω·cm)
```
**Fonte**: Buffa R, Saragat B, Cabras S, Rinaldi AC, Marini E. "Accuracy of Specific BIVA for the Assessment of Body Composition in the United States Population." *PLoS ONE.* 2013;8(3):e58533. DOI: 10.1371/journal.pone.0058533

### 1.3 Angolo di fase (entrambi i metodi)
```
Angolo di fase (°) = arctan(Xc / R) × 180/π
```
Identità trigonometrica, nessuna fonte esterna necessaria.

### 1.4 Ellissi di tolleranza (50°/75°/95°) e di confidenza
Traduzione letterale delle Eq. 1a/2a: `K = F(n+1)/[n(n-2)]` (tolleranza) o `K = F/[n(n-2)]` (confidenza); semiassi `L1,L2 = √(K·[(n-1)(sx²+sy²) ± √discriminante])`.
**Fonte**: Piccoli A, Pastori G. "BIVA software." Università di Padova, 2002.
**Nota**: bug storico corretto in questa sessione — la radice quadrata va sull'intero prodotto `K·(...)`, non solo sulla parentesi interna (altrimenti l'ellisse si restringe in modo non fisiologico all'aumentare di n).

---

## 2. Stime quantitative — Metodo STANDARD (popolazione generale)

| Parametro | Formula | Fonte |
|---|---|---|
| **TBW** (uomini) | `1.203 + 0.449×(H²/R) + 0.176×peso` | Sun SS, et al. *Am J Clin Nutr.* 2003;77:331-340. DOI: 10.1093/ajcn/77.2.331. **Verificato sul PDF originale** in questa sessione — Tabella 5, coefficienti pubblicati 1.20/0.45/0.18 (arrotondati a 2 decimali), N=712 |
| **TBW** (donne) | `3.747 + 0.450×(H²/R) + 0.113×peso` | Idem, Tabella 5, N=1089 |
| **FFM** (uomini) | `-10.68 + 0.65×(H²/R) + 0.26×peso + 0.02×R` | Sun SS, et al. 2003, Tabella 5 — **equazione diretta, stessa fonte e popolazione del TBW** (non più derivata da una costante di idratazione). N=669, R²=0.90, RMSE=3.9kg |
| **FFM** (donne) | `-9.53 + 0.69×(H²/R) + 0.17×peso + 0.02×R` | Idem, N=944, R²=0.83, RMSE=2.9kg |
| **FM** | `peso − FFM` | Identità |
| **ECW** | `0.189×(H²/R) + 0.052×peso − 0.0002×(H²/Xc) + 1.03` | Lukaski HC, Bolonchuk WW. *Aviat Space Environ Med.* 1988;59:1163-1169. Adulti sani N=110. Coefficienti verificati su **due fonti secondarie indipendenti concordanti**: Matias et al. 2016 (Tab. 1) e Siconolfi et al. 1997 (*J Appl Physiol* 82:704-710, testo) |
| **ICW** | `TBW − ECW` | Identità (TBW = ECW + ICW) |
| **BCM** | `1.898×(H²/Xcp) − 0.051×peso + 4.18×sesso + 15.496` (Xcp = reattanza parallela) | Dittmar M, Reber H. *Am J Physiol Endocrinol Metab.* 2001;281:E1005-14 (citata in ESPEN/Kyle 2004, Tab. 6). **Coefficienti riconfermati indipendentemente** (stessi numeri esatti) da Campa F, et al. *J Transl Med.* 2024;22:515. DOI: 10.1186/s12967-024-05272-x — revisione sistematica **letta direttamente** (PDF fornito dall'utente, Tabella 4), che conferma essere l'**unica equazione BCM pubblicata** su 64 studi rintracciati (1988-2023) |
| **Xcp** (serie→parallelo) | `(R² + Xc²) / Xc` | Identità circuitale standard (ammettenza), non specifica di uno studio |

`H` = altezza in cm, `R`/`Xc` in Ω, peso in kg, sesso: uomo=1/donna=0.

**Limiti dichiarati nel codice**:
- BCM: sviluppata su popolazione anziana tedesca (60-90 anni) — testata contro referti Akern reali, risultati **disomogenei** (0.3-4.5kg su anziani, da -6.1 a -13.4kg su 4 casi di obesità BMI 33.9-37.5). Nessuna equazione BCM specifica per obesità esiste in letteratura — confermato dalla revisione sistematica di Campa et al. 2024 (unica equazione BCM pubblicata in 35 anni) — resta un limite noto, strutturale e non risolvibile con i dati attualmente raccolti (servirebbe una fonte che semplicemente non esiste ancora).
- FFM (superato, vedi sopra): fino a una sessione precedente si usava TBW/0.73 (costante di idratazione ESPEN — comunque solida: Wang Z, et al. *Am J Clin Nutr.* 1999;69:833-841, media 0.737±0.036 su cadaveri umani, stabile tra specie, ma con variabilità individuale intrinseca ±0.02-0.03). Sostituita con l'equazione diretta di Sun 2003 perché stessa fonte/popolazione del TBW, senza assumere una costante esterna.

**Episodio chiuso — FFM specifica per sovrappeso/obesità (Costa/Masset et al. 2025, *Front Nutr* 12:1499752, validata su DXA N=269
brasiliani) provata e ritirata**: per un periodo, FFM per BMI≥25 usava questa equazione al posto di TBW/0.73. Validazione empirica
contro 6 referti Akern reali con BMI≥25 (entrambe le fasce 25-29.9 e ≥30) ha mostrato che in **5 casi su 6** la vecchia TBW/0.73
risultava più vicina al valore Akern (scarti da 0.1 a 5.2kg a favore della formula semplice). Equazione di per sé valida e
correttamente citata — non ritirata per un difetto proprio, ma per mismatch empirico con questa popolazione/dispositivo (ipotesi
più probabile: differenza etnica tra il campione di sviluppo brasiliano e i pazienti sardi). Ripristinato TBW/0.73 uniforme.
Nota metodologica lasciata nel codice sorgente (`lib/biva-engine.ts`) per futura consultazione.

---

## 3. Stime quantitative — Metodo ATLETA

| Parametro | Formula | R² / SEE |
|---|---|---|
| **TBW** | `0.286 + 0.195×(S²/R) + 0.385×peso + 5.086×sesso` | R²=0.93, SEE=2.42 kg |
| **ECW** | `1.579 + 0.055×(S²/R) + 0.127×peso + 0.006×(S²/Xc) + 0.932×sesso` | R²=0.84, SEE=1.33 kg |
| **ICW** | `TBW − ECW` | — |
| **FFM, FM, BCM** | stesse formule del metodo Standard (FFM=TBW/0.73, BCM=Dittmar & Reber) | — |

**Fonte**: Matias CN, et al. "Estimation of total body water and extracellular water with bioimpedance in athletes." *Clin Nutr.* 2016;35(2):468-474. DOI: 10.1016/j.clnu.2015.03.013 — Tabella 3, N=139 (92 uomini/47 donne).

**Limiti dichiarati dagli autori** (nel codice): validata su 208 atleti di livello nazionale 21.3±5.0 anni — non generalizzabile fuori da popolazione sportiva giovane-adulta. Intervalli di confidenza individuali ampi (TBW ±5.6 kg, ECW ±3.6/+4 kg, ICW ±6 kg) — più adatta a un trend nel tempo che a un valore assoluto isolato.

**Verificato numericamente** in questa sessione contro i due esempi worked-example forniti dall'utente (Caso 1: TBW 45.59L/ECW 18.48L/ICW 27.11L; Caso 2: TBW 63.98L) — corrispondenza esatta.

---

## 4. BMI

```
BMI = peso / altezza²  (kg/m²)
```
Classificazione: sottopeso <18.5, normopeso 18.5–24.9, sovrappeso 25–29.9, obesità ≥30.
**Fonte**: OMS/WHO Technical Report Series 894, 2000. Generico, non specifico per BIVA.

---

## 5. Range di riferimento (fasce colorate) — solo modalità Standard salvo dove indicato

| Parametro | Range "normale" (25°-75° percentile o ±1 SEE) | Fonte |
|---|---|---|
| **FFMI** (kg/m²) | Uomini 18.7–21.0 · Donne 14.9–17.2, stabile a tutte le età | Coin A, et al. *Clin Nutr.* 2008;27:87-94. DOI: 10.1016/j.clnu.2007.10.008. PMID 18206273. Popolazione italiana N=1866 |
| **FMI** (kg/m²) | 6 fasce decennali esatte (Tabella 4) — Uomini: 20-29 2.9–4.8 · 30-39 3.8–6.0 · 40-49 4.3–7.2 · 50-59 5.0–7.4 · 60-69 5.8–8.5 · 70-80 5.6–8.6. Donne: 20-29 4.9–8.2 · 30-39 6.1–9.3 · 40-49 5.9–9.7 · 50-59 6.9–10.5 · 60-69 8.0–11.5 · 70-80 7.7–11.3 | Idem, Tabella 4 |
| **TBW** (% peso) | 45–65% (fascia "normale"), 35–75% limiti esterni | Range fisiologico generale, non percentili di uno studio specifico |
| **ECW/TBW%** | Valore atteso individualizzato età+sesso+BMI ±1 SEE (±1.06 uomini, ±1.46 donne) | Enderle J, et al. *Clin Nutr.* 2023;42:644-652. DOI: 10.1016/j.clnu.2023.03.006. N=1958 adulti caucasici 18-97 anni, Tabella 2 (modello BMI-dipendente) |
| **ICW/TBW%** | Complemento matematico: `100% − ECW/TBW% atteso`, stesso SEE | Stessa fonte di sopra — non è una fonte separata, è un'identità (TBW=ECW+ICW) |
| **BMI** | 18.5–24.9 | OMS/WHO (vedi sopra) |

Formula del valore atteso ECW/TBW% (Enderle 2023, Tab. 2, modello con BMI):
```
Uomini: -0.0979×età + 0.00198×età² + 0.1131×BMI + 38.68
Donne:  -0.0960×età + 0.002088×età² + 0.1119×BMI + 42.00
```
**Verificato**: la somma `ECW atteso + ICW atteso` dà sempre esattamente 100.000000% (identità matematica, testato numericamente). I valori prodotti dalla formula sono stati confrontati con la Fig. 1 dell'articolo (grafici età/BMI) e risultano coerenti (es. donna 20 anni BMI 25 → 43.7% calcolato vs ~41-42% dal grafico; donna 80 anni BMI 25 → 50.5% calcolato vs ~50-52% dal grafico).

### 5.1 Parametri SENZA fascia colorata (gap dichiarati, non implementati)
- **ICW in valore assoluto** (litri) e **BCM**: nessun range età/sesso-specifico validato trovato in letteratura con lo stesso rigore delle fonti sopra. Per il BCM, gap esplicitamente confermato da una revisione sistematica recente (Kampo D, Závodná E, Vondra V. *Physiol Res.* 2025;74(Suppl 1):S77-S92. PMID 41511100).
- **ECW/ICW in modalità Atleta**: nessuna fascia colorata — la fonte Enderle 2023 è validata solo su popolazione generale caucasica, non su atleti; applicarla lì riprodurrebbe lo stesso errore metodologico che l'equazione Matias 2016 è nata per risolvere.

---

## 6. Incongruenza trovata e corretta in questo controllo

Un blocco di commento in `lib/biva-engine.ts` (righe 219-227 prima della correzione) descriveva ancora il **vecchio metodo** ECW/ICW a rapporto fisso 40%/60% (Moissl et al. 2006), sostituito nel codice funzionante da Lukaski & Bolonchuk 1988 individualizzato in una sessione precedente. Il codice era corretto, solo il commento era rimasto disallineato — corretto nel commit `13297e5`. Nessun impatto sui calcoli o sui referti già generati.

**Seconda incongruenza (commit `c729961`)**: la fascia FMI (Coin et al. 2008) era implementata come una semplificazione a 2 sole fasce d'età (<50/≥50 anni), usando solo i valori delle fasce estreme (20-29 e 70-80) citati nel testo della discussione del paper. Verificando la Tabella 4 originale (PDF fornito dall'utente), le fasce intermedie sono sensibilmente diverse (es. uomini 40-49: 4.3–7.2, non 2.9–4.8 come usato per "tutti gli under-50"), e i valori usati per le donne **non corrispondevano a nessuna fascia della tabella originale** — probabilmente un valore approssimato in una sessione precedente, mai verificato sulla fonte primaria fino ad ora. Corretto con le 6 fasce decennali esatte. Impatto pratico: pazienti nelle fasce 30-49 e 50-69 anni (di entrambi i sessi) potevano ricevere una fascia colorata FMI leggermente scorretta prima di questa correzione — la FFMI non era interessata (confermata stabile a tutte le età dagli stessi autori).

---

## 7. Tabella riassuntiva delle fonti

| Studio | Journal, anno | DOI / PMID | Verificato tramite |
|---|---|---|---|
| Piccoli et al. 1994 | Kidney Int. | — | Fonte primaria, formula vettore |
| Piccoli & Pastori 2002 | BIVA Software, Univ. Padova | — | Fonte primaria, ellissi |
| Buffa & Marini 2013 | PLoS ONE | 10.1371/journal.pone.0058533 | Open access, fonte primaria |
| Sun et al. 2003 | Am J Clin Nutr | 10.1093/ajcn/77.2.331 | **PDF fornito dall'utente**, letto per intero — TBW confermato esatto (Tabella 5); scoperta un'equazione FFM diretta nella stessa tabella, ora in uso al posto di TBW/0.73 |
| Kyle et al. 2004 (ESPEN) | Clin Nutr | 10.1016/j.clnu.2004.06.004 | Fonte primaria (citazione della costante 0.73, non più in uso per il metodo Standard — vedi Wang et al. 1999 sotto) |
| Lukaski & Bolonchuk 1988 | Aviat Space Environ Med | — (paywall) | **2 fonti secondarie indipendenti concordanti** (Matias 2016 Tab.1, Siconolfi 1997 testo) — PDF di Siconolfi fornito dall'utente |
| Dittmar & Reber 2001 | Am J Physiol Endocrinol Metab | — | Citata in ESPEN 2004; testata contro referti Akern reali (risultati disomogenei, limite dichiarato); **coefficienti riconfermati indipendentemente** da Campa et al. 2024 (stessi numeri esatti) |
| Matias et al. 2016 | Clin Nutr | 10.1016/j.clnu.2015.03.013 | **PDF fornito dall'utente**, verificato numericamente contro 2 worked examples |
| Coin et al. 2008 | Clin Nutr | DOI 10.1016/j.clnu.2007.10.008, PMID 18206273 | **PDF fornito dall'utente**, verificato riga per riga su Tabelle 2 e 4 — FFMI confermata esatta, **FMI corretta**: la vecchia approssimazione a 2 fasce (<50/≥50) non rifletteva le 6 fasce decennali reali, specie per la fascia 40-59 e per i valori femminili (non corrispondevano affatto alla tabella originale) |
| WHO TRS 894, 2000 | — | — | Classificazione standard internazionale, nota |
| Enderle et al. 2023 | Clin Nutr | 10.1016/j.clnu.2023.03.006 | **PDF fornito dall'utente**, verificato numericamente contro Fig.1 e identità matematica |
| Wang Z, et al. 1999 | Am J Clin Nutr | — | **PDF fornito dall'utente**, letto per intero — revisione della costante di idratazione 0.73 (0.737±0.036 su cadaveri umani); non più usata per il calcolo FFM in modalità Standard (sostituita da Sun 2003 diretta), citata solo come contesto storico |
| Campa et al. 2024 | J Transl Med | 10.1186/s12967-024-05272-x | **PDF fornito dall'utente**, letto per intero — revisione sistematica che conferma Dittmar & Reber 2001 come unica equazione BCM pubblicata (64 studi, 1988-2023) |
| Kampo, Závodná & Vondra 2025 | Physiol Res | PMID 41511100 | **Mai verificata direttamente da me in questa conversazione** — ereditata da una sintesi di sessioni precedenti. Sostituita in via primaria da Campa et al. 2024 (sopra), che ho letto di persona per la stessa affermazione (gap equazioni BCM) |

---

## 8. Cosa NON è ancora implementato (onestamente dichiarato)

1. Fascia colorata per **ICW assoluto** e **BCM** — nessuna fonte verificata trovata (confermato gap strutturale da Campa et al. 2024)
2. Fascia colorata **ECW/ICW per la modalità Atleta** — la fonte disponibile (Enderle 2023) non è validata su sportivi
3. **BIVA specifica**: nessuna popolazione di riferimento con parametri (media/SD/r) ancora caricata nel database — il motore di calcolo la supporta, ma senza popolazioni di riferimento verificate non è utilizzabile in pratica
4. **Letti ma non applicati**: Pozo et al. 2026 (*Nutrition*, angolo di fase in obesità sarcopenica — letteratura ancora troppo eterogenea per una soglia clinica precisa, nessun meta-analisi possibile secondo gli stessi autori); Rosa et al. 2025 (*Rev Endocr Metab Disord*, angolo di fase in età pediatrica — non applicabile, questa app resta per adulti)

---

## 9. Validazione empirica contro referti Akern reali (dati aggregati, anonimi)

Confronto tra il metodo Standard di questa app e referti Akern Bodygram reali (dispositivo con **algoritmi proprietari non pubblicati** — vedi manuale Bodygram Pro, che dichiara esplicitamente risultati diversi dalle equazioni pubblicate). Nessun nome paziente è conservato in questo repository.

**Campione**: 9 soggetti reali (7 con dato Akern per FFMI/FMI, 2 con tabella assoluta completa TBW/ECW/ICW/FFM/FM/BCM).

| Parametro | Risultato |
|---|---|
| BMI | Corrispondenza pressoché esatta su tutti i 9 (identità matematica, atteso) |
| Angolo di fase | Corrispondenza pressoché esatta sui 2 casi con dato Akern disponibile (diff -0.00° e +0.01° — identità trigonometrica, atteso) |
| FFMI | **N=7, tutti con differenza negativa** (media -0.45 kg/m², range -0.15/-0.75) — bias sistematico e direzionale, non rumore casuale |
| FMI | Speculare a FFMI: tutti con differenza positiva |
| TBW | 2/2 casi con differenza negativa, entro 1.2L — coerente con SEE pubblicato di Sun 2003 |
| ECW | 2/2 casi con differenza negativa più marcata (-2.8 e -3.8 punti percentuali) |
| ICW | Speculare a ECW (per costruzione, ICW=TBW-ECW) |
| Idratazione (TBW/FFM) | La nostra app dà **sempre esattamente 73.0%** per costruzione matematica (FFM=TBW/0.73) — non è una misura indipendente. Akern oscilla realisticamente 72.8-73.6% per soggetto, suggerendo un percorso di calcolo diverso (non FFM=TBW/costante) |
| **BCM** | Caso più critico: un soggetto obeso (BMI 34.6) ha mostrato uno scarto di **-13.4 kg** rispetto ad Akern — molto più ampio degli scarti già noti su soggetti anziani (0.3-4.5kg). Rafforza fortemente la cautela già documentata su questa equazione (Dittmar & Reber 2001, sviluppata su anziani magri): sembra deteriorarsi ulteriormente anche per obesità, non solo per età fuori range |

**Interpretazione**: un algoritmo proprietario non pubblicato non è un metro di paragone assoluto — è una stima indipendente con il proprio errore, non il "valore vero" (quello sarebbe la diluizione isotopica). Gli scarti osservati sono attesi tra metodi diversi validati su campioni diversi, non necessariamente un errore delle formule pubblicate qui implementate. Il valore di questa validazione è nel **pattern**: direzionalità sistematica e ripetuta (utile per sapere come interpretare un confronto fianco a fianco con un dispositivo Akern) e nell'aver isolato un caso limite concreto (BCM su obesità) che merita cautela extra nell'uso clinico.

