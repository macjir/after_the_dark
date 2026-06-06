# After the Dark — n8n Integration Guide

Tento dokument popisuje vše, co potřebuješ vědět pro nastavení n8n flows pro aplikaci **After the Dark**.

---

## Přehled architektury

```
[Aplikace]  →  POST na n8n webhook URL  →  [n8n flow zpracuje]
[n8n flow]  →  POST callback na /api/webhook/n8n  →  [Aplikace zobrazí výsledek real-time]
```

Jsou **dva samostatné n8n flows** — jeden pro občany, jeden pro koordinátora.  
Aplikace na n8n nečeká (fire & forget) — n8n odpovídá asynchronně přes callback URL.

---

## 1. Přihlášení / přístup k aplikaci

Aplikace **nemá přihlašování** — je to demo. Stránky jsou přístupné přímo na URL:

| Stránka | URL |
|---|---|
| Rozcestník | `https://[tvoje-domena]/` |
| Občan 1 — Jan Novák | `https://[tvoje-domena]/citizen/1` |
| Občan 2 — Marie Svobodová | `https://[tvoje-domena]/citizen/2` |
| Koordinátor — Starosta Dvořák | `https://[tvoje-domena]/coordinator` |

> Každý otevře svoji stránku na telefonu. Všechny tři se aktualizují real-time.

---

## 2. Flow pro občana (Citizen Chat)

### 2a. Aplikace → n8n (příchozí na n8n)

Aplikace zavolá tvůj **Citizen Webhook** metodou `POST`.  
URL nastaví Jirka do env proměnné `N8N_CITIZEN_WEBHOOK_URL`.

**Hlavičky:**
```
Content-Type: application/json
```

**Tělo requestu:**
```json
{
  "input": {
    "text": "Kde seženám vodu?",
    "source": "chat"
  },
  "context": {
    "crisis": {
      "type": "blackout",
      "area": "Demo Zone"
    },
    "location": "Praha 7",
    "health": "Diabetes: yes, Heart disease: no, Movement restrictions: no, Pregnancy: no",
    "contacts": [
      {
        "id": "uuid-zde",
        "name": "Marie Svobodová",
        "phone": "+420 987 654 321",
        "status": "ok"
      },
      {
        "id": "uuid-zde",
        "name": "Mamka",
        "phone": "+420 123 456 789",
        "status": "unknown"
      }
    ],
    "coordinator_updates": [
      {
        "message": "Distribuční místo vody: ZŠ Korunovační, otevřeno do 19:00",
        "valid_until": null
      }
    ],
    "session": "user: Kde seženám vodu?\nai: Nejbližší distribuční místo...\nuser: A co léky?"
  },
  "session_id": "citizen-1",
  "callback_url": "https://[tvoje-domena]/api/webhook/n8n"
}
```

**Popis polí:**

| Pole | Typ | Popis |
|---|---|---|
| `input.text` | string | Aktuální zpráva uživatele |
| `input.source` | string | Vždy `"chat"` |
| `context.crisis.type` | string | `"normal"` nebo `"blackout"` |
| `context.crisis.area` | string | Vždy `"Demo Zone"` |
| `context.location` | string | Lokalita občana |
| `context.health` | string | Zdravotní info občana |
| `context.contacts[]` | array | Kontakty uživatele s jejich stavem (`ok` / `unknown`) |
| `context.coordinator_updates[]` | array | Posledních 5 aktualit od koordinátora |
| `context.session` | string | Posledních 20 zpráv konverzace (chronologicky), formát `role: text` per řádek |
| `session_id` | string | `"citizen-1"` nebo `"citizen-2"` — **musí se vrátit v odpovědi** |
| `callback_url` | string | URL kam máš poslat odpověď |

---

### 2b. n8n → Aplikace (odpověď přes callback)

Po zpracování pošli `POST` na `callback_url` z requestu (= `https://[tvoje-domena]/api/webhook/n8n`).

**Hlavičky:**
```
Content-Type: application/json
x-webhook-secret: [hodnota N8N_WEBHOOK_SECRET]    ← pokud je nastavené, jinak vynech
```

**Tělo odpovědi:**
```json
{
  "session_id": "citizen-1",
  "role": "ai",
  "content": "Nejbližší distribuční místo vody je ZŠ Korunovační, otevřeno do 19:00. Doporučuji naplnit všechny dostupné nádoby ihned.",
  "suggested_buttons": [
    "Jak dlouho vydrží zásoby?",
    "Co mám dělat s léky?",
    "Je bezpečné zůstat doma?"
  ],
  "call_izs": false,
  "send_ok_to_contacts": false
}
```

**Popis polí odpovědi:**

| Pole | Typ | Povinné | Popis |
|---|---|---|---|
| `session_id` | string | **ANO** | Musí odpovídat `session_id` z requestu (`citizen-1` nebo `citizen-2`) |
| `role` | string | **ANO** | Vždy `"ai"` |
| `content` | string | **ANO** | Text odpovědi zobrazený uživateli |
| `suggested_buttons` | string[] | ne | 0–3 tlačítka pro rychlou odpověď (zobrazí se pod zprávou) |
| `call_izs` | boolean | ne | `true` = zobrazí se červené tlačítko "CALL 112" |
| `send_ok_to_contacts` | boolean | ne | `true` = zobrazí se zelené tlačítko "Send OK to my contacts" |

> **Poznámka:** Pole `can_send`, `final_announcement` a `announcement_type` jsou pouze pro koordinátora — u občana je posílat nemusíš (nebo pošli `false`/`null`).

---

## 3. Flow pro koordinátora (Coordinator Chat)

### 3a. Aplikace → n8n (příchozí na n8n)

Aplikace zavolá tvůj **Coordinator Webhook** metodou `POST`.  
URL nastaví Jirka do env proměnné `N8N_COORDINATOR_WEBHOOK_URL`.

**Tělo requestu:**
```json
{
  "input": {
    "text": "Od 14:00 je výpadek proudu v celé Demo Zone, důvod neznámý, předpokládaná obnova za 4 hodiny",
    "source": "coordinator_chat"
  },
  "context": {
    "current_status": "normal",
    "area": "Demo Zone",
    "session": "user: Od 14:00 je výpadek proudu...\nai: Mám ještě pár otázek — víte, jak velká oblast je postižena?"
  },
  "session_id": "coordinator",
  "callback_url": "https://[tvoje-domena]/api/webhook/n8n"
}
```

**Popis polí:**

| Pole | Typ | Popis |
|---|---|---|
| `input.text` | string | Aktuální zpráva koordinátora |
| `input.source` | string | Vždy `"coordinator_chat"` |
| `context.current_status` | string | `"normal"` nebo `"blackout"` — aktuální stav systému |
| `context.area` | string | Vždy `"Demo Zone"` |
| `context.session` | string | Posledních 20 zpráv konverzace (chronologicky) |
| `session_id` | string | Vždy `"coordinator"` |
| `callback_url` | string | URL kam máš poslat odpověď |

---

### 3b. n8n → Aplikace (odpověď)

#### Varianta A — n8n se ještě doptává (nemá dost informací)

```json
{
  "session_id": "coordinator",
  "role": "ai",
  "content": "Rozumím. Ještě potřebuji vědět: jsou postiženy nemocnice nebo kritická infrastruktura?",
  "suggested_buttons": [
    "Ano, nemocnice jsou postiženy",
    "Ne, jen obytné oblasti",
    "Nevím"
  ],
  "can_send": false,
  "final_announcement": null,
  "announcement_type": null
}
```

#### Varianta B — n8n má dost informací, aktivuje tlačítko odeslání

```json
{
  "session_id": "coordinator",
  "role": "ai",
  "content": "Připravil jsem oficiální zprávu pro občany. Zkontrolujte ji a pokud souhlasíte, odešlete.",
  "suggested_buttons": [],
  "can_send": true,
  "final_announcement": "⚡ Od 14:00 probíhá výpadek elektrické energie v celé Demo Zone. Příčina se vyšetřuje, předpokládané obnovení do 18:00. Zachovejte klid, distribuční místo vody: ZŠ Korunovační. Sledujte tuto aplikaci.",
  "announcement_type": "blackout"
}
```

**Popis polí odpovědi koordinátora:**

| Pole | Typ | Povinné | Popis |
|---|---|---|---|
| `session_id` | string | **ANO** | Vždy `"coordinator"` |
| `role` | string | **ANO** | Vždy `"ai"` |
| `content` | string | **ANO** | Zpráva pro koordinátora (zobrazí se v jeho chatu) |
| `suggested_buttons` | string[] | ne | Rychlé odpovědi pro koordinátora |
| `can_send` | boolean | **ANO** | `true` = aktivuje tlačítko "SEND TO ALL CITIZENS" |
| `final_announcement` | string / null | **ANO** | Finální vyšperkovaný text aktuality pro občany |
| `announcement_type` | string / null | **ANO** | Typ aktuality — viz tabulka níže |
| `call_izs` | boolean | ne | Pro koordinátora nevyužito, pošli `false` |
| `send_ok_to_contacts` | boolean | ne | Pro koordinátora nevyužito, pošli `false` |

**Hodnoty `announcement_type`:**

| Hodnota | Efekt v aplikaci |
|---|---|
| `"blackout"` | Přepne všechny občany do stavu **POWER OUTAGE**, zobrazí velký dialog |
| `"all_clear"` | Přepne zpět na **NORMAL**, zobrazí zelený dialog "All Clear" |
| `"update"` | Zobrazí dialog s aktualitou, stav se nemění |
| `"info"` | Zobrazí dialog s informací, stav se nemění |

---

## 4. Logika coordinator flow (doporučený postup)

```
1. Přijmout zprávu od koordinátora
2. Zkontrolovat context.session — co víme dosud?
3. Chybí-li klíčové informace → odpovědět s otázkou, can_send: false
4. Klíčové informace pro blackout aktualitu:
   - Jaký typ události? (výpadek proudu, záplavy, …)
   - Od kdy?
   - Jak velká oblast?
   - Předpokládaná délka?
   - Jsou dostupná distribuční místa / útočiště?
5. Jakmile jsou informace kompletní:
   - Sestavit finální text aktuality (max. 3–4 věty, klidný tón, bez paniky)
   - Vrátit can_send: true + final_announcement + správný announcement_type
```

---

## 5. Env proměnné (nastaví Jirka na Vercelu)

Pro tvoje n8n jsou relevantní tyto hodnoty (Jirka ti je dá):

| Proměnná | Co to je |
|---|---|
| `N8N_CITIZEN_WEBHOOK_URL` | URL tvého Citizen webhook triggeru v n8n |
| `N8N_COORDINATOR_WEBHOOK_URL` | URL tvého Coordinator webhook triggeru v n8n |
| `N8N_WEBHOOK_SECRET` | Volitelný tajný token pro ověření callbacku (pokud nastavíte) |

---

## 6. Callback endpoint (kam posíláš odpovědi)

```
POST https://[tvoje-domena]/api/webhook/n8n
```

**Hlavičky:**
```
Content-Type: application/json
x-webhook-secret: [N8N_WEBHOOK_SECRET]    ← pouze pokud je nastavené
```

Aplikace okamžitě po přijetí uloží zprávu do Supabase a všechny otevřené prohlížeče ji zobrazí real-time bez nutnosti refreshe.

**Odpovědi endpointu:**
- `200 { "success": true }` — vše OK
- `400` — chybí `session_id` nebo `content`
- `401` — špatný nebo chybějící `x-webhook-secret`
- `500` — DB chyba

---

## 7. Rychlý test bez aplikace (curl)

Simulace odpovědi od n8n pro občana 1:
```bash
curl -X POST https://[tvoje-domena]/api/webhook/n8n \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "citizen-1",
    "role": "ai",
    "content": "Testovací odpověď z n8n.",
    "suggested_buttons": ["Zjistit více", "Rozumím"],
    "call_izs": false,
    "send_ok_to_contacts": false
  }'
```

Simulace blackout aktuality od koordinátora:
```bash
curl -X POST https://[tvoje-domena]/api/webhook/n8n \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "coordinator",
    "role": "ai",
    "content": "Zpráva je připravena k odeslání.",
    "can_send": true,
    "final_announcement": "Testovací blackout aktualita.",
    "announcement_type": "blackout",
    "suggested_buttons": []
  }'
```
