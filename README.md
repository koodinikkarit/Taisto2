# Taisto

Taisto on selainpohjainen käyttöliittymä ja taustapalvelu kuvanohjausmatriisien hallintaan. Sovellus käyttää Node.js/Express-palvelinta, GraphQL-rajapintaa, React-käyttöliittymää ja socket.io:ta.

## Kehitys

Tarvitset Node.js 24:n.

```powershell
npm ci
npm run dev
```

Sovellus avautuu osoitteessa `http://localhost:1337`. Tuotantotilassa käytä `npm start`. Selainpaketin rakentaa `npm run build` ja matriisitestin ajaa `npm run testmatrix`.

### Riippuvuuksien turvallisuuspolitiikka

Projektin `.npmrc` hyväksyy vain vähintään seitsemän päivää vanhat pakettijulkaisut ja estää riippuvuuksien asennusskriptit. Projekti vaatii npm-version 11.10 tai uudemman. `npm run build`, `npm start` ja muut erikseen käynnistetyt projektikomennot toimivat edelleen, mutta pakettien `preinstall`-, `install`- ja `postinstall`-skriptejä ei ajeta.

GitHub Actions tarkistaa ennen Docker-buildia, että `package-lock.json` vastaa tätä politiikkaa. Docker-image kopioi saman `.npmrc`-tiedoston ennen `npm ci` -asennusta. Tagijulkaisu luo lisäksi GitHub Releasen automaattisilla julkaisutiedoilla ja liittää siihen valmiin Companion-ZIPin. Vain semanttisesti uusin vakaa `vMAJOR.MINOR.PATCH`-tagi päivittää GHCR:n `latest`-tagin ja GitHubin Latest release -merkinnän.

### Anonymisoitu mock-data

Projektissa on anonymisoitu testitietokanta tiedostossa [tests/fixtures/mock-database.json](tests/fixtures/mock-database.json). Se perustuu tuotantotietokannan rakenteeseen, mutta sisältää vain kuvitteellisia matriiseja, IP-osoitteita ja laitenimiä. Mock-matriisin osoite `192.0.2.10` kuuluu dokumentaatiolle varattuun TEST-NET-alueeseen. Sen `mock: true` -asetus simuloi kytkentäpalautteet paikallisesti, joten **Vaihda laite** toimii ilman oikeaa laitetta.

Käynnistä sovellus mock-datalla:

```powershell
npm run dev:mock
```

Komento kopioi mock-datan väliaikaiseen `database/database.json`-tiedostoon, poistaa paikallisen mock-SQLite-tietokannan ja käynnistää kehityspalvelimen. Ensimmäinen käynnistys tuo JSON-datan automaattisesti tiedostoon `database/taisto.sqlite`. Voit palauttaa mock-datan ilman palvelimen käynnistämistä komennolla `npm run mock:reset`. Älä käytä näitä komentoja tuotantopalvelimella: ne korvaavat paikallisen tietokannan.

## Käyttöliittymä

- Kieli voidaan vaihtaa suomen ja englannin välillä valikosta.
- Ohjesivu on reitissä `/apua`. Sen lähdetiedosto on [apua.md](apua.md), jossa on suomen- ja englanninkielinen sisältö.
- Sovellus näyttää alanurkassa versionumeron ja build-tunnisteen. Paikallisessa ajossa tunniste on `local`.

## Salasanasuojaus

Promode (`/promode`) ja Asetukset (`/settings`) suojataan kirjautumissivulla vain, kun `TAISTO_PASSWORD` on asetettu. Onnistunut kirjautuminen käyttää 8 tuntia voimassa olevaa HTTP-only-istuntocookiea. Ilman salasanaa suojaus ei ole käytössä.

```powershell
$env:TAISTO_PASSWORD = "vahva-salasana"
$env:TAISTO_USER = "taisto" # valinnainen; oletus on taisto
npm start
```

## Docker

Paikallinen image:

```powershell
docker build -t taisto:local .
docker run --rm -p 1337:80 -e TAISTO_PASSWORD="vahva-salasana" taisto:local
```

GitHub Container Registryn private-imagen käyttö:

```powershell
docker login ghcr.io
docker pull ghcr.io/koodinikkarit/taisto2:latest
docker run --rm -p 1337:80 -e TAISTO_PASSWORD="vahva-salasana" ghcr.io/koodinikkarit/taisto2:latest
```

Tuotannossa tietokantahakemisto liitetään pysyvään levyyn:

```powershell
docker run --name taisto -p 1337:80 -v B:\database:/usr/src/database ghcr.io/koodinikkarit/taisto2:latest
```

`latest` tarkoittaa viimeisintä onnistuneesti julkaistua tag-buildia. Käytä tuotannossa mieluummin tarkkaa versiota, esimerkiksi `ghcr.io/koodinikkarit/taisto2:0.1.9`.

### Docker-kontin päivittäminen

Palvelimen päivitysskripti on tiedostossa [`scripts/update-docker.sh`](scripts/update-docker.sh). Se lataa ensin uuden imagen, pysäyttää ja poistaa vanhan `taisto`-kontin, käynnistää uuden kontin samalla tietokantaliitoksella sekä näyttää lopuksi kontin tilan ja viimeisimmät lokirivit.

Yksityiseen GHCR-imageen kirjaudutaan kerran käyttäen GitHub-tokenia, jolla on `read:packages`-oikeus:

```bash
echo "$GITHUB_TOKEN" | docker login ghcr.io -u GITHUB_KAYTTAJA --password-stdin
```

Ota skripti käyttöön ja suorita päivitys näin:

```bash
chmod +x scripts/update-docker.sh
TAISTO_PASSWORD='vahva-salasana' ./scripts/update-docker.sh
```

Skripti vaatii `TAISTO_PASSWORD`-muuttujan, jotta palvelua ei käynnistetä vahingossa ilman salasanasuojausta. Oletuksena se käyttää imagea `ghcr.io/koodinikkarit/taisto2:latest`, tietokantahakemistoa `/home/taisto/database`, porttia `1337` ja audit-lokin rajoittamatonta säilytystä (`0`). Asetuksia voi muuttaa ympäristömuuttujilla `TAISTO_IMAGE`, `TAISTO_CONTAINER_NAME`, `TAISTO_DATABASE_DIR`, `TAISTO_HOST_PORT` ja `TAISTO_AUDIT_RETENTION_DAYS`.

Esimerkiksi tarkkaan versioon lukittu päivitys:

```bash
TAISTO_PASSWORD='vahva-salasana' \
TAISTO_IMAGE='ghcr.io/koodinikkarit/taisto2:0.1.21' \
./scripts/update-docker.sh
```

## Julkaisut ja GitHub Actions

Docker-build käynnistyy vain Git-tagista, jonka nimi alkaa `v`:llä. Esimerkiksi tagi `v0.1.8`:

1. Päivittää buildissä sovellusversion arvoon `0.1.8`.
2. Julkaisee image-tagit `0.1.8`, commit-hashin ja `latest`.
3. Luo build-tunnisteen muodossa `GitHub-run-id-yritys-commit-hash`.

Julkaisu tehdään näin:

```powershell
git tag -a v0.1.8 -m "Release v0.1.8"
git push origin v0.1.8
```

## Rajapinnat ja data

- GraphQL on osoitteessa `/api`; kehitystilassa GraphiQL on käytettävissä samassa osoitteessa.
- REST-rajapinta on `/rest`. Katso tarkemmat pyynnöt tiedostosta `REST_API.md`, koneellisesti luettava määritys tiedostosta `openapi.yaml` ja selainkäyttöliittymästä `/api-docs`.
- REST-rajapinnan muuttavat pyynnöt vaativat API-avaimen. Avaimia luodaan ja hallitaan sivulla **Asetukset → API-avaimet**. Avaimen voi lähettää `X-API-Key`-otsakkeessa tai Bearer-tokenina; lukuoperaatiot eivät vaadi avainta.
- API-avaimet voidaan nimetä, asettaa vanhenemaan tai jättää pysyvästi voimassa oleviksi sekä ottaa yksitellen pois käytöstä. Samalta asetussivulta voidaan sallia muuttavat REST-pyynnöt 15 minuutiksi, tunniksi, neljäksi tunniksi, päiväksi, viikoksi tai 30 päiväksi ilman avainta; lupa päättyy automaattisesti valitun ajan jälkeen.
- Avaimet, käyttölaskurit ja viimeisimmät käyttöajat tallennetaan pyynnöstä selväkielisinä SQLite-tietokannan `rest_api_keys`-tauluun.
- Sovelluksen pysyvä data on tiedostossa `database/taisto.sqlite`. Docker-imagessa polku on `/usr/src/database/taisto.sqlite`, joten koko `/usr/src/database`-hakemisto tulee liittää pysyvään levyyn.
- Paikallinen Bitfocus Companion -moduuli on hakemistossa `companion-module-taisto/`.
- Ohjesivulta voi ladata valmiiksi rakennetun Companion-moduulin osoitteesta `/downloads/taisto-companion.zip`. Tagistä käynnistyvä GitHub Actions -julkaisutyö rakentaa ZIPin, julkaisee sen workflow-artifaktina ja sisällyttää saman paketin Docker-kuvaan.

### Audit-loki

SQLite-tietokannan `audit_logs`-tauluun kirjataan muuttavat REST-pyynnöt, GraphQL-mutaatiot, API-avainasetusten muutokset, kirjautumisyritykset sekä käyttöliittymän WebSocketilla tekemät video- ja KVM-ohjaukset. Merkintä sisältää UTC-aikaleiman, toiminnon, kohteen, tekijän tai API-avaimen tunnisteen, IP-osoitteen ja onnistumistilan. API-avaimia, salasanoja ja Authorization-otsakkeita ei tallenneta.

Lokit näkyvät sivulla **Asetukset → Audit-loki** paikallisessa ajassa. Näkymä näyttää 200 uusinta tapahtumaa. Säilytysaika asetetaan ympäristömuuttujalla `TAISTO_AUDIT_RETENTION_DAYS`; oletus on `90` päivää ja arvo `0` estää automaattisen poistamisen. Sallitut arvot ovat kokonaislukuja väliltä 0–3650. Vanheneminen lasketaan tietokantaan tallennetusta UTC-ajasta. Audit-loki säilyy `database/taisto.sqlite`-tiedostossa muun pysyvän datan kanssa, eikä sitä sisällytetä JSON-vientiin.

Docker-esimerkki: `docker run -e TAISTO_AUDIT_RETENTION_DAYS=30 ...`

### Siirtyminen database.json-tiedostosta SQLiteen

Jos `database/taisto.sqlite` ei ole vielä alustettu mutta `database/database.json` löytyy, sovellus tuo vanhan JSON-tietokannan automaattisesti SQLiteen ennen palvelimen käynnistymistä. Tuonti tehdään yhdessä tietokantatransaktiossa ja alkuperäisestä JSON-tiedostosta luodaan aikaleimattu `database.pre-sqlite-backup.*.json`-varmuuskopio. Vanhaa JSON-tiedostoa ei poisteta.

Migraation voi tehdä myös erikseen:

```powershell
npm run db:migrate
```

Omien polkujen käyttö:

```powershell
npm run db:migrate -- --json B:\database.json --sqlite B:\database\taisto.sqlite
```

SQLite-tietokannan voi viedä takaisin vanhan rakenteen JSON-varmuuskopioksi:

```powershell
npm run db:export-json
npm run db:export-json -- --sqlite B:\database\taisto.sqlite --output B:\backup\database.json
```

Tee varmuuskopio mieluiten vientikomennolla palvelimen ollessa käynnissä. Jos kopioit SQLite-tiedoston suoraan, pysäytä palvelin ensin, jotta WAL-tiedoston keskeneräiset muutokset eivät jää kopiosta pois.

### Näyttöryhmät

**Asetukset → Näyttöryhmät** -sivulla voidaan luoda ryhmä saman matriisin output-porteista. Ryhmälle voidaan sallia kaikki matriisin inputit tai vain erikseen valitut inputit, kuten Kaavioissa. Suoritus valitulla inputilla vaihtaa kaikki ryhmän outputit siihen. Taisto lähettää yhden TCP-komennon outputtia kohden 10 ms välein ja pyytää lopuksi matriisilta tilapäivityksen. Ryhmän REST-rajapinta on `/rest/con-groups`; tarkat pyynnöt ovat [REST_API.md](REST_API.md)-tiedostossa ja OpenAPI-kuvauksessa.

## Deployment

Helm-julkaisu löytyy hakemistosta `deployment/`. Ympäristökohtaiset asetukset ovat tiedostossa `deployment/values.yaml`.
