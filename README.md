# Taisto

Selainpohjainen käyttöliittymä ja taustapalvelu, joilla ohjataan Taisto-kuvanohjausmatriiseja.
Sovellus koostuu Node.js/Express -palvelimesta, GraphQL-rajapinnasta sekä React-pohjaisesta
käyttöliittymästä, joka renderöidään myös palvelinpäässä.

## Arkkitehtuuri pähkinänkuoressa
- Express-palvelin palvelee GraphQL-rajapinnan polussa `/api` ja statiset resurssit hakemistosta `public/`.
- Apollo Client ja React/Apollo muodostavat käyttöliittymän, Redux vastaa tilanhallinnasta.
- `socket.io` välittää reaaliaikaiset tilapäivitykset selaimeen esimerkiksi matriisikytkentöjen muutoksista.
- Pysyvä tila säilytetään JSON-muotoisena tiedostossa `database/database.json` (luodaan ajon aikana).
- Helm-pohjainen julkaisu löytyy hakemistosta `deployment/`, ja `linux/` sisältää avainskriptejä käyttöönottoa varten.

## Kehitysympäristön käynnistäminen
1. Asenna Node.js 24 LTS ja npm (projekti on testattu uusinta LTS-versiota vasten).
2. Asenna riippuvuudet komennolla `npm install --legacy-peer-deps` (osa vanhoista Apollo-paketeista vaatii legacy-peer -lipun).
3. Käynnistä kehitystilainen palvelin: `npm run dev`.
   - Palvelu nousee oletuksena osoitteeseen <http://localhost:1337>.
   - GraphiQL-työkalu on käytettävissä osoitteessa <http://localhost:1337/api>.
4. Tarvitsetko auto-reloadin? Käytä `npm run watch`, joka ajaa `babel-node app.js`in `nodemonin` kautta.

## REST-rajapinta
- Uusi `/rest`-polku tarjoaa GraphQL:n toiminnot REST-muodossa. Tarkemmat kutsut on dokumentoitu tiedostossa `REST_API.md`.
  Esimerkit:
  ```bash
  # Vaihda con-portin videolähde (CPU)
  curl -X POST "http://localhost:1337/rest/con-ports/12/video-connection" \
    -H "Content-Type: application/json" \
    -d '{"cpuPort":"34"}'

  # Katkaise con-portin videokytkentä
  curl -X DELETE "http://localhost:1337/rest/con-ports/12/video-connection"

  # Vaihda CPU-portin KWM-kytkentä (con)
  curl -X POST "http://localhost:1337/rest/cpu-ports/34/kwm-connection" \
    -H "Content-Type: application/json" \
    -d '{"conPort":"12"}'

  # Katkaise CPU-portin KWM-kytkentä
  curl -X DELETE "http://localhost:1337/rest/cpu-ports/34/kwm-connection"
  ```

## Bitfocus Companion quick-start (Generic HTTP)
Tämä esimerkki näyttää, miten kytket yksittäisen con-portin videolähteen ja saat napille feedbackin REST-rajapinnan kautta.

**Compatibility**
- Bitfocus Companion v4.3.0+ (Generic HTTP)

**Action (POST)**
- Method: `POST`
- URL: `http://localhost:1337/rest/con-ports/35/video-connection`
- Headers: `Content-Type: application/json`
- Body:
```json
{"cpuPort":"37"}
```

**Feedback (GET)**
- Method: `GET`
- URL: `http://localhost:1337/rest/con-ports/35/video-connection`
- Suositeltu pollausväli: 500–1000 ms

**Esimerkkivastaus**
```json
{
  "conPort": { "id": "35", "slug": "Näyttö 1", "portNum": 1 },
  "cpuPort": { "id": "37", "slug": "PC 5", "portNum": 5 },
  "status": "connected"
}
```

**Feedback-logiikka (esimerkki)**
- Väri:
  - `status == "connected"` -> vihreä
  - `status == "disconnected"` -> punainen/harmaa
  - `status == "unknown"` -> keltainen/harmaa
- Teksti:
  - `status == "connected"` -> `CPU {cpuPort.portNum}` tai `cpuPort.slug`
  - Muulloin -> `Ei kytkentää`

**Performance note**
- Jos käytössä on paljon nappeja, käytä pidempää pollausväliä (esim. 1000–2000 ms) tai ryhmittele napit, jotta REST-kutsujen määrä pysyy kohtuullisena.

## Bitfocus Companion module (local)
Tämä repo sisältää paikallisen Companion-moduulin hakemistossa `companion-module-taisto/`.

**Asennus**
1. Asenna moduulin riippuvuudet hakemistossa `companion-module-taisto`.
```bash
cd companion-module-taisto
npm install
```
2. Avaa Companion.
3. Mene `Settings` -> `Modules` -> `Install module from local folder`.
4. Valitse `companion-module-taisto`-hakemisto.

**Käyttö**
1. Lisää moduuli-instanssi ja aseta Host/Port.
2. Lisää action `Set video connection`.
3. Aseta `Con port id` arvoon `35`.
4. Aseta `CPU port id` arvoon `37`.
5. Lisää feedback `Video connection active`.
6. Aseta `Con port id` arvoon `35`.
7. Aseta `CPU port id` arvoon `37`.
8. Aseta feedbackin taustaväri punaiseksi.
9. Valinnainen: lisää action `Turn off video connection`.
10. Aseta `Con port id` arvoon `35`.

**Tykki**
- Lisää action `Tykki power` (toggle) tai `Tykki power on/off`.
- Lisää action `Tykki pikakomento`, jos haluat valmiit input/power/freeze/blank -komennot.
- Projector host/port/path asetukset löytyvät moduulin konfiguraatiosta.
- Oletuskoodi on `category 4054` + `code 15`. Jos tykki tukee erillisiä ON/OFF‑koodeja, aseta ne actionin options‑kenttiin.
- Feedback `Tykki power on` käyttää tilaa `current_power_is_on`.

## Tuotantokäyttö ja build
- Rakenna selainpaketti komennolla `npm run build`, jolloin tiedosto `public/app.js` syntyy Webpack 5:llä.
- Käynnistä palvelin tuotantotilassa komennolla `npm start` (GraphiQL pois päältä, oletusportti 1337).
- Docker-kontin voi rakentaa päivitetystä `Dockerfile`:stä, joka pohjautuu Node 24 -kuvaan.
- Tarvittaessa portti voidaan määrittää parametreilla, esim. `npm start -- -p 8080`.

## Data ja kokoonpano
- Ensimmäisellä käynnistyskerralla varmista, että hakemisto `database/` on olemassa; sovellus luo sinne tiedoston `database.json`.
- `backend/TaistoService.js` hallinnoi datarakennetta ja kirjoittaa muutokset levylle viiveellä, jotta sarjatallennus ei kuormita levyä.
- `.gitignore` ei sisällä tietokantatiedostoa – se kannattaa varmuuskopioida erikseen ennen tuotantopäivityksiä.

## Testit ja kehitystyökalut
- Hakemistossa `tests/` on Node-pohjaisia apuskriptejä, jotka voidaan ajaa Babelin kautta, esim. `npx babel-node tests/MatrixTest.js`.
- GraphQL-skeema sijaitsee hakemistossa `backend/graphql/` ja React-koodi kansiossa `js/`.
- Käännöstyökaluna käytetään Webpackia ja Babelia (`webpack.config.js`).

## Vinkkejä jatkokehitykseen
- Pidä `database/database.json` versionhallinnan ulkopuolella, mutta säilytä siitä varmuuskopiot.
- Uusia GraphQL-kyselyjä lisättäessä muista päivittää sekä skeema että Apollo-kyselyt (`js/graphql`).
- Deploymentissa hyödynnetään Helm-charttia; tarkista `deployment/values.yaml` ympäristökohtaista konfiguraatiota varten.
