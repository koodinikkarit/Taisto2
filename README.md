# Taisto

![Taiston logo](public/taisto-logo-naytto-kytkenta.png)

Taisto on selainpohjainen käyttöliittymä ja taustapalvelu kuvanohjausmatriisien hallintaan. Sovellus käyttää Node.js/Express-palvelinta, GraphQL-rajapintaa, React-käyttöliittymää ja socket.io:ta.

Virallinen logo on [läpinäkyvä PNG](public/taisto-logo-naytto-kytkenta.png), ja siitä on myös [animoitu GIF-versio](public/taisto-logo-animoitu.gif). Aiemmat logovaihtoehdot ovat projektin `public`-kansiossa.

## Kehitys

Tarvitset Node.js 24:n.

```powershell
npm ci
npm run dev
```

Sovellus avautuu osoitteessa `http://localhost:1337`. Tuotantotilassa käytä `npm start`. Selainpaketin rakentaa `npm run build` ja matriisitestin ajaa `npm run testmatrix`.

### Riippuvuuksien turvallisuuspolitiikka

Projektin `.npmrc` hyväksyy vain vähintään seitsemän päivää vanhat pakettijulkaisut ja estää riippuvuuksien asennusskriptit. Projekti vaatii npm-version 11.10 tai uudemman. `npm run build`, `npm start` ja muut erikseen käynnistetyt projektikomennot toimivat edelleen, mutta pakettien `preinstall`-, `install`- ja `postinstall`-skriptejä ei ajeta.

GitHub Actions tarkistaa ennen Docker-buildia, että `package-lock.json` vastaa tätä politiikkaa. Docker-image kopioi saman `.npmrc`-tiedoston ennen `npm ci` -asennusta. Tagijulkaisu luo lisäksi GitHub Releasen automaattisilla julkaisutiedoilla ja liittää siihen valmiit Companion- ja Chrome-lisäosan ZIP-paketit. Vain semanttisesti uusin vakaa `vMAJOR.MINOR.PATCH`-tagi päivittää GHCR:n `latest`-tagin ja GitHubin Latest release -merkinnän.

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

## Käyttäjät ja salasanasuojaus

Käyttäjiä hallitaan sivulla **Asetukset → Käyttäjät**. Salasanat tallennetaan SQLite-tietokantaan `scrypt`-tiivisteinä, ei selväkielisinä. Käyttäjäkortti näyttää viimeisimmän kirjautumisen, kirjautumiskertojen määrän, viimeisimmän IP-osoitteen sekä luonti- ja muokkausajat. Ajat tallennetaan UTC-muodossa ja näytetään selaimen paikallisessa ajassa. Onnistunut kirjautuminen käyttää 8 tuntia voimassa olevaa, HTTP-only- ja SameSite-istuntocookiea.

- `admin` voi käyttää koko sovellusta ja hallita asetuksia sekä käyttäjiä.
- `user` voi nähdä ja käyttää kaavioita, näyttöryhmiä, oletustiloja ja Promodea, mutta ei pääse Asetuksiin eikä voi suorittaa asetuksia muuttavia GraphQL-mutaatioita.
- Viimeistä tietokannan admin-käyttäjää ei voi poistaa tai muuttaa tavalliseksi käyttäjäksi, ellei palvelimelle ole asetettu `TAISTO_PASSWORD`-ympäristömuuttujaa korvaavaksi admin-tunnukseksi.

Kun tietokannassa ei vielä ole käyttäjiä, `TAISTO_USER` ja `TAISTO_PASSWORD` toimivat admin-tason aloitustunnuksena. Ensimmäinen tietokantaan luotu käyttäjä pakotetaan adminiksi. Ympäristötunnus toimii lisäksi varatunnuksena aina, kun tietokannassa ei ole yhtään admin-käyttäjää. Kun tietokannassa on admin, uudet ympäristötunnuksen kirjautumiset poistuvat käytöstä; jo avattu istunto säilyy voimassa normaalin päättymisaikansa loppuun.

Jos tietokannassa ei ole käyttäjiä eikä `TAISTO_PASSWORD`-muuttujaa ole asetettu, anonyymi käyttö toimii entiseen tapaan eikä kirjautumista vaadita. Kun tunnistautuminen on käytössä, Promode vaatii `admin`- tai `user`-kirjautumisen ja Asetukset vaativat `admin`-roolin.

```powershell
$env:TAISTO_PASSWORD = "vahva-salasana"
$env:TAISTO_USER = "taisto" # valinnainen aloitustunnus; oletus on taisto
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

### Chrome-lisäosa

Chrome-lisäosalla voi valita kaavion, tarkastella sen näyttöjen viimeksi tunnettua kytkentää ja vaihtaa näytön lähteen kaaviolle sallittujen inputtien joukosta. Lisäosalla ei muokata kaavioiden asetuksia.

Tagijulkaisussa valmis `taisto-chrome-extension.zip` on saatavilla GitHub Releasessa sekä julkaistun Docker-imagen palvelimen ohjesivulta osoitteesta `/static/taisto-chrome-extension.zip`. Paikallisen lähdekoodikäynnistyksen ohjesivun latauslinkki toimii vain, jos ZIP on erikseen luotu `public`-kansioon. Pura ZIP ja avaa Chromessa `chrome://extensions`. Ota **Kehittäjätila** käyttöön, valitse **Lataa pakkaamaton** ja osoita purettua kansiota, jossa `manifest.json` sijaitsee. Kehityksessä voit valita suoraan projektin `chrome-extension`-kansion. Lisäosa asennetaan tällä tavalla paikallisesti; sitä ei julkaista Chrome Web Storessa tämän työnkulun kautta.

Määritä lisäosassa Taiston osoite, esimerkiksi `http://localhost:1337`, ja **Asetukset → API-avaimet** -sivulla luotu REST API-avain. Selain pyytää verkkoyhteyden käyttöoikeuden. Avainta ei synkronoida: se pysyy selaimen istunnossa ja pitää syöttää uudelleen Chromen käynnistyttyä uudestaan. Ilman avainta kytkentöjä voi vaihtaa vain, jos anonyymit REST-kirjoitukset on erikseen sallittu määräajaksi. Nykyinen API-avain sallii laajasti REST-muutoksia eikä sitä ole rajattu kaavioihin. Sisäverkon HTTP-yhteys ei salaa API-avainta; käytä suojattua yhteyttä tai luotettua verkkoa. Onnistunut vaihtopyyntö kertoo komennon lähettämisestä. Lisäosa seuraa Taiston viimeksi tuntemaa tilaa, mutta rajapinta ei kerro tilan ikää, joten se ei takaa tuoretta laitevahvistusta.

### Telegram

Telegram-botilla voi tarkastella matriiseja ja suorittaa oletustiloja sekä näyttöryhmiä. Telegram-tuki on oletuksena pois käytöstä.

1. Luo botti Telegramin [BotFatherilla](https://t.me/BotFather) ja kopioi sen token. Älä jaa tokenia.
2. Avaa Taistossa **Asetukset → Telegram**, anna token ja ota botti käyttöön. Tallennettua tokenia ei näytetä uudelleen; tyhjä token-kenttä säilyttää aiemman tokenin.
3. Odota, kunnes botin yhteystila on **Yhdistetty**. Lähetä botille Telegramissa yksityisviesti `/id` ja lisää sen palauttama numeerinen käyttäjätunniste sallittuihin tunnisteisiin asetussivulla. Useat tunnisteet erotetaan pilkuilla. Tyhjä lista estää muut komennot; `/id`-komennolla voi selvittää oman tunnisteen.
4. Halutessasi ota audit-ilmoitukset käyttöön ja anna vastaanottavan keskustelun numeerinen chat ID. Varmista, että botti voi lähettää kyseiseen keskusteluun.

Ohjaukset hyväksytään vain sallittujen käyttäjien yksityisviesteistä, ei ryhmäkeskusteluista. Komennot:

- `/status [sivu]` — luettelee matriisit; ei näytä niiden yhteystilaa.
- `/oletustilat [sivu]` — luettelee oletustilat ja niiden ID:t.
- `/suorita ID` — suorittaa annetun oletustilan.
- `/nayttoryhmat [sivu]` — luettelee näyttöryhmät ja niiden ID:t.
- `/inputit RYHMA_ID [sivu]` — luettelee ryhmälle sallitut inputit ja niiden ID:t.
- `/ryhma RYHMA_ID INPUT_ID` — vaihtaa ryhmän annettuun inputiin. Käytä listauksen input-ID:tä, ei porttinumeroa.

Kytkentäkomennon hyväksyntä tarkoittaa, että komennot on asetettu jonoon; se ei takaa, että matriisi on vahvistanut tai toteuttanut kytkennän. Botti ohittaa käynnistyessä jonossa olevat viestit. Jos kytkentäkomento viivästyy yli kaksi minuuttia esimerkiksi verkkokatkon takia, sitä ei suoriteta. Lähetä komento uudelleen, jos haluat yhä tehdä vaihdon.

Bottitoken tallennetaan selväkielisenä SQLite-tietokantaan eikä sitä näytetä asetussivulla. Telegram-asetuksia tai tokenia ei sisällytetä normaaliin JSON-vientiin, joten ne on asetettava uudelleen JSON-palautuksen jälkeen. Suojaa tietokantatiedosto ja sen varmuuskopiot sekä Taiston asetukset kirjautumisella. Audit-ilmoitukset lähetetään valittuun Telegram-keskusteluun, joten valitse vastaanottaja huolella.

### Audit-loki

SQLite-tietokannan `audit_logs`-tauluun kirjataan muuttavat REST-pyynnöt, GraphQL-mutaatiot, API-avainasetusten muutokset, kirjautumisyritykset sekä käyttöliittymän WebSocketilla tekemät video- ja KVM-ohjaukset. Merkintä sisältää UTC-aikaleiman, toiminnon, kohteen, tekijän tai API-avaimen tunnisteen, IP-osoitteen ja onnistumistilan. Kun selaimessa on voimassa oleva käyttäjäistunto, myös anonyymisti sallitut REST-, GraphQL- ja WebSocket-toiminnot kirjataan kyseisen käyttäjän tekemiksi. Nimenomaisesti API-avaimella tehty pyyntö kirjataan edelleen API-avaimelle. API-avaimia, salasanoja ja Authorization-otsakkeita ei tallenneta.

Lokit näkyvät sivulla **Asetukset → Audit-loki** paikallisessa ajassa. Näkymä näyttää 200 uusinta suodatukseen sopivaa tapahtumaa. Lokia voi suodattaa vapaalla haulla, toiminnolla, onnistumistilalla, tekijätyypillä ja paikallisessa ajassa annetulla aikavälillä. Säilytysaika asetetaan ympäristömuuttujalla `TAISTO_AUDIT_RETENTION_DAYS`; oletus on `90` päivää ja arvo `0` estää automaattisen poistamisen. Sallitut arvot ovat kokonaislukuja väliltä 0–3650. Vanheneminen lasketaan tietokantaan tallennetusta UTC-ajasta. Audit-loki säilyy `database/taisto.sqlite`-tiedostossa muun pysyvän datan kanssa, eikä sitä sisällytetä JSON-vientiin.

Docker-esimerkki: `docker run -e TAISTO_AUDIT_RETENTION_DAYS=30 ...`

### Siirtyminen database.json-tiedostosta SQLiteen

Nykyisen SQLite-tietokannan täydellinen rakenne on tiedostossa [`backend/storage/schema.sql`](backend/storage/schema.sql). Se toimii luettavana skeemakuvauksena ja sillä voi alustaa uuden tyhjän SQLite-tietokannan. Sovelluksen käyttämät versioidut päivitysmigraatiot ovat edelleen `backend/storage/SqliteStorage.js`-tiedostossa ja ne suoritetaan automaattisesti käynnistyksen yhteydessä.

Jos `database/taisto.sqlite` ei ole vielä alustettu mutta `database/database.json` löytyy, sovellus tuo JSON-tietokannan automaattisesti SQLiteen ennen palvelimen käynnistymistä, kun alla kuvatut palautuksen suojausvaatimukset täyttyvät. Tuonti tehdään yhdessä tietokantatransaktiossa ja alkuperäisestä JSON-tiedostosta luodaan aikaleimattu `database.pre-sqlite-backup.*.json`-varmuuskopio. Vanhaa JSON-tiedostoa ei poisteta.

Migraation voi tehdä myös erikseen:

```powershell
npm run db:migrate
```

Omien polkujen käyttö:

```powershell
npm run db:migrate -- --json B:\database.json --sqlite B:\database\taisto.sqlite
```

SQLite-tietokannan voi viedä JSON-varmuuskopioksi:

```powershell
npm run db:export-json
npm run db:export-json -- --sqlite B:\database\taisto.sqlite --output B:\backup\database.json
```

JSON-vienti sisältää sovelluksen asetusten ja API-avainten lisäksi käyttäjät ja niiden salasanatiivisteet. Suojaa varmuuskopiot huolellisesti: API-avaimet ovat selväkielisinä. Istunnot ja audit-loki eivät sisälly vientiin. Jos varmuuskopiossa ei ole admin-käyttäjää, `TAISTO_PASSWORD` on asetettava palautuksessa; salasanaa ei tallenneta varmuuskopioon. Näin toimitaan myös silloin, kun vientikomento suoritetaan erillisessä prosessissa ilman tuotannon ympäristösalasanaa. Jos haluat nimenomaisesti palauttaa käyttäjättömän varmuuskopion anonyymiksi, voit asettaa `TAISTO_ALLOW_UNPROTECTED_BACKUP_RESTORE=true` palautuksen ajaksi. Mock-komennot asettavat tämän automaattisesti. Varmuuskopion käyttäjät tuodaan vain alustettaessa tyhjää tietokantaa, ja aiemmat istunnot mitätöityvät.

Kirjautumisyrityksiä ja Basic-tunnistautumista rajoitetaan sovellusprosessissa: enintään 20 yritystä minuutissa samasta osoitteesta ja 200 yhteensä sekä neljä yhtäaikaista tarkistusta. Rajoitus nollautuu uudelleenkäynnistyksessä eikä ole jaettu usean palvelininstanssin kesken. Salasanan vaihto mitätöi käyttäjän kaikki istunnot ja uloskirjautuminen kyseisen istunnon. Päivitys tähän versioon kirjaa aiemmat istunnot ulos.

Vanhat JSON-tiedostot, jotka on luotu ennen käyttäjien varmistustukea, eivät sisällä käyttäjiä eikä niistä voi päätellä, oliko kirjautuminen käytössä. Vanhan JSONin tuonti pysähtyy oletuksena, ellei `TAISTO_PASSWORD` ole asetettu. Luo käyttäjät uudelleen ennen palvelun avaamista verkkoon. Jos haluat nimenomaan tuoda vanhan tiedoston ilman kirjautumissuojausta, voit erikseen asettaa `TAISTO_ALLOW_UNPROTECTED_LEGACY_IMPORT=true` tuonnin ajaksi. Tämä ei muuta uusien, ilman JSON-tuontia luotujen anonyymien asennusten toimintaa.

Tee varmuuskopio mieluiten vientikomennolla palvelimen ollessa käynnissä. Jos kopioit SQLite-tiedoston suoraan, pysäytä palvelin ensin, jotta WAL-tiedoston keskeneräiset muutokset eivät jää kopiosta pois.

### Näyttöryhmät

**Asetukset → Näyttöryhmät** -sivulla voidaan luoda ryhmä saman matriisin output-porteista sekä muokata myöhemmin ryhmään kuuluvia näyttöjä. Ryhmälle voidaan sallia kaikki matriisin inputit tai vain erikseen valitut inputit, kuten Kaavioissa. Suoritus valitulla inputilla vaihtaa kaikki ryhmän outputit siihen. Taisto lähettää yhden TCP-komennon outputtia kohden 10 ms välein ja pyytää lopuksi matriisilta tilapäivityksen. Ryhmän REST-rajapinta on `/rest/con-groups`; tarkat pyynnöt ovat [REST_API.md](REST_API.md)-tiedostossa ja OpenAPI-kuvauksessa.

## Deployment

Helm-julkaisu löytyy hakemistosta `deployment/`. Ympäristökohtaiset asetukset ovat tiedostossa `deployment/values.yaml`.
