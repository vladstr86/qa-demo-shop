# QA-001 r1 — EUR și ajustarea testelor

Stare inițială: **pending — așteaptă aprobarea utilizatorului**. Crearea agentului nu aprobă implementarea acestui prompt. Aplică-l numai după aprobarea explicită pentru QA-001 r1, în conversația Codex sau prin comanda locală de trimitere.

Website de referință: QA Demo Shop, corecția EUR din commit `967675b1e203d6920d925610364b7300587c4dad`. Manifestul `qa/latest.json` leagă această versiune de fișierele efective ale site-ului și ale promptului.

## Obiectiv și sursă

Lucrează în proiectul local QA Demo Shop. Înainte de editare rulează `npm run qa:review`, inclusiv dacă aprobarea a fost dată manual în VS Code. Confirmă QA-001 r1 și amprentele valide; dacă verificarea eșuează, oprește aplicarea și pregătește un prompt actualizat pentru review. Citește `AGENTS.md`, `package.json`, configurația Playwright, `dist/app.js`, POM, fixtures și testele existente. Actualizează implementarea locală și suita Playwright pentru EUR, păstrând modificările locale compatibile.

Sursa de referință folosește deja `priceCents`, `subtotalCents`, `totalCents`, `money(cents)`, selectorii `cart-unit-price-{key}` și `Cart.calculateSubtotalCents(language)`. Nu duplica acești helperi dacă există local. Aplicația și subtotalul așteptat trebuie să folosească cenți întregi. Dacă versiunea locală încă are RON, aliniaz-o la valorile de mai jos.

Arhiva de referință are 31 de scenarii / 62 de instanțe desktop-mobile. Proiectul local poate avea deja suita redusă: inspectează și adaptează, fără înlocuirea oarbă a testelor. Prezintă un plan scurt și continuă în scopul aprobat; pentru cerințe noi sau diferențe care schimbă scopul, prezintă o revizie nouă înainte de aplicarea lor. Nu face commit, push, merge sau deploy.

## Prețuri fixe pentru demo

| Produs/variantă | EUR | Cenți |
| --- | ---: | ---: |
| Atlas 14, RAM 16 GB, SSD 512 GB | 799,00 | 79900 |
| Atlas 14, RAM 32 GB, SSD 1 TB | 959,50 | 95950 |
| Horizon 16, RAM 16 GB | 1.099,50 | 109950 |
| Horizon 16, RAM 32 GB | 1.219,75 | 121975 |
| Pulse Pro wireless | 139,95 | 13995 |
| Pulse Pro wired | 119,95 | 11995 |
| Wave Mini | 49,90 | 4990 |
| Studio Keyboard | 69,00 | 6900 |
| Mouse Precision | 39,99 | 3999 |
| Livrare standard | 3,00 | 300 |
| Livrare express | 6,50 | 650 |

Atlas: RAM 32 GB adaugă 100,00 EUR, SSD 1 TB adaugă 60,50 EUR. Horizon: RAM 32 GB adaugă 120,25 EUR. Prețul „De la/From” al căștilor în catalog este 119,95 EUR; varianta wireless selectată costă 139,95 EUR. Nu folosi conversie valutară dinamică.

Verifică EUR cu exact două zecimale în catalog, produs, coș, livrare, checkout și confirmare. RO: `799,00 €`, `139,95 €`, `2.017,85 €`. EN: `€799.00`, `€139.95`, `€2,017.85`. Acceptă spațiile Unicode ale `Intl.NumberFormat`. Verifică simbolul, cele două zecimale și separatorul; nu compara exclusiv cu o copie a formatterului aplicației. Schimbarea limbii păstrează valorile în cenți, variantele, cantitățile și datele checkout.

## Date pozitive permanente

Centralizează și reutilizează: **Vlad Strut**, **strutv@gmail.com**, shipping **Damrak, 70, Amsterdam, NL**, billing **221B Baker St, London, UK**, dummy card **4111 1111 1111 1111**, expiry **12/39**, CVV **369**.

Login mock separat: **demo@atelier.test / Demo123!**. În checkout autentificat verifică inițial emailul precompletat, apoi folosește datele fixe ale clientului.

Actualizează inclusiv valorile implicite din POM, de exemplu `CheckoutPage.card()`, și aserțiunile pentru datele păstrate la RO/EN. Pentru negative flow folosește copii ale datelor pozitive, schimbă un singur câmp relevant și restaurează-l. Nu modifica obiectul comun.

## Aserțiunea matematică și for loop-ul

Integrează în scenariul de coș existent, fără un caz suplimentar doar pentru exercițiu:

1. Resetează coșul și filtrele și setează RO. Adaugă Atlas negru, RAM 16 GB, SSD 512 GB, cantitate 2.
2. În catalogul nefiltrat, parcurge cardurile cu un `for` loop în POM. La indexul 2 verifică identitatea produsului Căști Pulse Pro, deschide-l și oprește bucla cu `break`. `.nth(index)` este permis pentru această cerință explicită de poziție.
3. Selectează negru, wireless și cantitate 3. Verifică exact două linii: `1-black-16-512` și `3-black-wireless`.
4. Citește prețurile unitare și cantitățile din DOM. Verifică separat prețurile față de fixture: 79900 și 13995 cenți. Recalculează independent: **79900 × 2 + 13995 × 3 = 201785 cenți**, adică **2.017,85 EUR**, înainte de livrare.
5. Schimbă Atlas la cantitate 1: **121885 cenți**. Șterge Pulse: **79900 cenți**. Păstrează verificările utile pentru persistență și linii distincte de variante, regrupate în scenariul de coș.

Operațiunile DOM și locatorii rămân în `Cart`/POM, iar aserțiunile în test. Parserul RO/EN elimină simbolul și spațiile, recunoaște separatorii și transformă separat partea întreagă și cele două zecimale în cenți. Fără `parseFloat()` pe text localizat și fără importarea calculului aplicației. Mesajele de eroare includ prețurile, cantitățile, suma așteptată și cea afișată.

## Checkout și negative flow

Calculează independent totalul: subtotal din DOM + livrarea selectată. Verifică Standard → Express → Standard, fără acumularea livrării, și totalul confirmării după golirea coșului. Exemplul de două produse: standard **202085**, express **202435** cenți. Mouse × 1: standard **4299**, express **4649** cenți.

Păstrează negative utile: opțiuni obligatorii lipsă, variante indisponibile, cantitate 0/11, email/adrese/card invalide, termeni nebifați. O acțiune respinsă păstrează coșul și totalul. Nu inventa câmpuri de monedă sau funcționalități inexistente.

## Structură și dimensiunea suitei

- JavaScript ESM, POM în `pages/` și `components/`, fixtures/date centralizate, teste pe funcționalități.
- CSS locators centralizați în POM, cu `page.locator()` / `root.locator()`, preferând `[data-testid="..."]`, ID și atribute stabile; scopare la dialogul/rândul relevant. Fără XPath, selectori lungi fragili sau așteptări fixe.
- Maximum **10 teste desktop la 1440×900** și **8 mobile la 390×844**, cu `isMobile` și `hasTouch`: **maximum 18 instanțe descoperite**. RO/EN se verifică în aceleași cazuri. Fără proiecte suplimentare pe limbă sau scenarii mobile sărite care umflă discovery.
- Integrează/regrupează în cele 8 scenarii comune: catalog/checkboxuri; produs/variante/galerie; coș matematic; login mock; guest checkout; negative produs; negative checkout; RO/EN și responsive. Păstrează până la 2 scenarii desktop pentru checkout autentificat și persistența sesiunii/remember me.
- Folosește bucle și `test.step()` în scenariile relevante, fără câte un `test()` pentru fiecare preț/limbă. Nu elimina acoperirea utilă doar pentru a reduce numărul.

## Criterii de finalizare

Verifică sintaxa, discovery și numărul per proiect, apoi rulează E2E desktop/mobile când mediul permite. Raportează fișierele schimbate, comenzile, rezultatele reale și blocajele. Distinge trecut/eșuat/nerulat. Corecția EUR din referință a trecut verificări Node, sintaxă și discovery; E2E în browser nu a fost rulat în acel mediu.
