# Taisto

Taisto on selainpohjainen käyttöliittymä ja taustapalvelu kuvanohjausmatriisien hallintaan. Sovellus käyttää Node.js/Express-palvelinta, GraphQL-rajapintaa, React-käyttöliittymää ja socket.io:ta.

## Kehitys

Tarvitset Node.js 24:n.

```powershell
npm ci
npm run dev
```

Sovellus avautuu osoitteessa `http://localhost:1337`. Tuotantotilassa käytä `npm start`. Selainpaketin rakentaa `npm run build` ja matriisitestin ajaa `npm run testmatrix`.

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

`latest` tarkoittaa viimeisintä onnistuneesti julkaistua tag-buildia. Käytä tuotannossa mieluummin tarkkaa versiota, esimerkiksi `ghcr.io/koodinikkarit/taisto2:0.1.7`.

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
- Sovelluksen data tallentuu tiedostoon `database/database.json`. Ota siitä varmuuskopiot ennen päivityksiä.
- Paikallinen Bitfocus Companion -moduuli on hakemistossa `companion-module-taisto/`.

## Deployment

Helm-julkaisu löytyy hakemistosta `deployment/`. Ympäristökohtaiset asetukset ovat tiedostossa `deployment/values.yaml`.
