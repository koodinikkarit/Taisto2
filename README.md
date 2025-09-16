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
1. Asenna Node.js 20 LTS ja npm (projekti on testattu uusinta LTS-versiota vasten).
2. Asenna riippuvuudet komennolla `npm install --legacy-peer-deps` (osa vanhoista Apollo-paketeista vaatii legacy-peer -lipun).
3. Käynnistä kehitystilainen palvelin: `npm run dev`.
   - Palvelu nousee oletuksena osoitteeseen <http://localhost:1337>.
   - GraphiQL-työkalu on käytettävissä osoitteessa <http://localhost:1337/api>.
4. Tarvitsetko auto-reloadin? Käytä `npm run watch`, joka ajaa `babel-node app.js`in `nodemonin` kautta.

## Tuotantokäyttö ja build
- Rakenna selainpaketti komennolla `npm run build`, jolloin tiedosto `public/app.js` syntyy Webpack 5:llä.
- Käynnistä palvelin tuotantotilassa komennolla `npm start` (GraphiQL pois päältä, oletusportti 1337).
- Docker-kontin voi rakentaa päivitetystä `Dockerfile`:stä, joka pohjautuu Node 20 -kuvaan.
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
