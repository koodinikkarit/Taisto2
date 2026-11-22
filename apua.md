<!-- fi -->
# Apua

Projektin lähdekoodi: [GitHub / koodinikkarit / Taisto2](https://github.com/koodinikkarit/Taisto2)

Muutokset: [Changelog](https://github.com/koodinikkarit/Taisto2/blob/master/CHANGELOG.md)

Tuki: [atk-tuki@turunhelluntaisrk.fi](mailto:atk-tuki@turunhelluntaisrk.fi)

Rajapintadokumentaatio: [API-dokumentaatio](/api-docs)

## Chrome-lisäosa

[Lataa Taisto Chrome -lisäosa (ZIP)](/static/taisto-chrome-extension.zip)

Pura ZIP, avaa Chrome-selaimessa `chrome://extensions`, kytke **Kehittäjätila** ja valitse **Lataa pakkaamaton**. Valitse purettu kansio, jonka juuressa on `manifest.json`. Määritä lisäosassa Taisto-palvelimen osoite ja tarvittaessa **Asetukset → API-avaimet** -sivulla luotu API-avain. Lisäosa näyttää kaaviot ja näyttöjen tunnetut tilat sekä vaihtaa näyttöjen lähteitä. API-avain säilyy vain selaimen istunnon ajan; se on syötettävä uudelleen Chromen uudelleenkäynnistyksen jälkeen. Ilman API-avainta vaihto onnistuu vain, jos anonyymit REST-kirjoitukset on sallittu väliaikaisesti. API-avaimella on laajat REST-kirjoitusoikeudet. Sisäverkon HTTP-yhteys ei salaa avainta. ZIP sisältyy tagijulkaisun Docker-imageen ja GitHub Releaseen.

Paikallisessa lähdekoodikäynnistyksessä latauslinkki toimii vain, jos ZIP on erikseen luotu `public`-kansioon. Kehityksessä Chromelle voi osoittaa suoraan projektin `chrome-extension`-kansion.

Vaihtokomennon lähetyksen jälkeen lisäosa seuraa Taiston viimeksi tuntemaa tilaa. Rajapinta ei kerro tilan ikää, joten vastaava tila ei takaa tuoretta laitevahvistusta.

## Bitfocus Companion

[Lataa Taisto Companion -moduuli (ZIP)](/downloads/taisto-companion.zip)

Pura ZIP-tiedosto ja valitse Companionissa **Settings → Modules → Install module from local folder**. Moduulin asetuksiin annetaan Taisto-palvelimen osoite, portti ja Asetukset-sivulla luotu REST API-avain. Moduuli tukee yksittäisiä videokytkentöjä, output-ryhmien suorittamista sekä projektorin ohjausta.

## Tykki

Ylläpitäjä ottaa tykin käyttöön kohdassa **Asetukset → Tykki**. Käytä Companionin projektoriasetuksista laitteen osoitetta, porttia ja ohjauspolkua. Osoitteen pitää toimia Taisto-palvelimelta.

Kirjaudu sisään ja avaa yläpalkista **Tykki**. Näet laitteen ilmoittaman virran ja kuvalähteen. Voit vaihtaa tuloa, pysäyttää tai pimentää kuvan. **Vaihda virtatilaa** käynnistää sammutetun tykin tai sammuttaa käynnissä olevan. Tarkista tila ennen vahvistamista. Jos laitemallille on määritetty erilliset virtakoodit, käytössä ovat niitä vastaavat painikkeet. Selain ei lähetä ohjauskomentoja itsestään.

## Telegram

Luo botti [BotFatherilla](https://t.me/BotFather), lisää sen token sivulla **Asetukset → Telegram** ja ota botti käyttöön. Odota yhteystilaksi **Yhdistetty**, lähetä botille yksityisviestinä `/id`, lisää saatu numeerinen käyttäjätunniste asetusten sallittujen listaan ja tallenna. Useat tunnisteet erotetaan pilkuilla. Tyhjä sallittujen lista estää muut komennot. Ohjauskomennot toimivat vain sallittujen käyttäjien yksityisviesteissä.

`/status [sivu]` listaa matriisit (ei yhteystilaa), `/oletustilat [sivu]` listaa oletustilat ja `/suorita ID` suorittaa oletustilan. `/nayttoryhmat [sivu]` listaa ryhmät, `/inputit RYHMA_ID [sivu]` ryhmän sallitut input-ID:t ja `/ryhma RYHMA_ID INPUT_ID` vaihtaa ryhmän lähteen. Käytä listauksen input-ID:tä, ei porttinumeroa. Kytkentöjen hyväksyminen kertoo komentojen jonotuksesta, ei matriisin laitevahvistuksesta. Botti ohittaa käynnistyessä jonossa olevat viestit eikä tee yli kaksi minuuttia viivästyneitä vaihtoja.

Audit-ilmoitukset voi ottaa erikseen käyttöön ja ohjata haluttuun keskusteluun chat ID:n avulla. Bottitoken säilytetään selväkielisenä SQLite-tietokannassa, mutta sitä ei näytetä asetuksissa. Telegram-asetukset eivät sisälly normaaliin JSON-vientiin, ja ne on määritettävä uudelleen JSON-palautuksen jälkeen. Suojaa tietokanta ja sen varmuuskopiot sekä asetussivu kirjautumisella; älä jaa tokenia.

Valitse ilmoituksille luotettu keskustelu. Sekä ilmoituksesta että kohdasta **Asetukset → Audit-loki** näet tekijän ja Taiston havaitseman lähde-IP:n, kun ne ovat tiedossa. Telegram-komennosta näet lähettäjän Telegram-tunnisteen, mutta et IP-osoitetta: Telegram ei välitä sitä botille.

Sivulla **Asetukset → Telegram** voit antaa sallitulle tunnisteelle oman nimen, kuten *Salioperaattori*. Nimen muuttaminen tai tyhjentäminen vaikuttaa vain tuleviin lokimerkintöihin ja ilmoituksiin. Nimi ei anna käyttöoikeutta: sen ratkaisee aina numeerinen Telegram-tunniste.

## Drive-varmuuskopiot

Kirjaudu ylläpitäjänä ja avaa **Asetukset → Drive-varmuuskopiot**. Varmista, että sekä Google OAuth -tunnukset että salausavain on määritetty palvelimelle. Anna yksityisen Drive-kansion tunniste, tallenna ja valitse **Varmista nyt**. Tarkista onnistumisaika ja tiedostonimi; hyväksytty pyyntö ei vielä ole valmis varmistus. Päivittäinen ajo klo 03.00 Suomen aikaa valitaan erikseen.

Salattu kopio sisältää koko tietokannan, myös käyttäjät, avaimet ja audit-lokin. Säilytä salausavain erillään Drivestä. Palvelimen ympäristöasetukset ja avaintiedostot on varmistettava erikseen. Asennus ja palautus uuteen tiedostoon on kuvattu projektin README-tiedoston kohdassa **Drive-varmuuskopiot**.

## Audit-loki

**Asetukset → Audit-loki** näyttää REST- ja käyttöliittymämuutokset, matriisin video- ja KVM-ohjaukset, API-avaimen nimen, lähdeosoitteen sekä pyynnön onnistumisen. Säilytysaika asetetaan palvelimen ympäristömuuttujalla `TAISTO_AUDIT_RETENTION_DAYS`; oletus on 90 päivää ja arvo `0` estää automaattisen poistamisen. Ajat näytetään selaimen paikallisessa ajassa. Salasanoja tai API-avainten sisältöä ei tallenneta lokiin.

## Käyttäjät

Admin hallitsee käyttäjiä sivulla **Asetukset → Käyttäjät**. `admin` voi muuttaa asetuksia, kun taas `user` voi käyttää kaavioita, näyttöryhmiä, oletustiloja ja Promodea ilman pääsyä asetuksiin. Viimeistä tietokannan adminia ei voi poistaa tai muuttaa käyttäjäksi ilman `TAISTO_PASSWORD`-ympäristömuuttujalla määritettyä korvaavaa admin-tunnusta. Ympäristötunnus toimii aloitus- ja varatunnuksena silloin, kun tietokannassa ei ole adminia. Ilman tietokantakäyttäjiä ja ympäristömuuttujan salasanaa sovellus säilyy anonyymisti käytettävänä.

## Aloittaminen

1. Avaa **Asetukset** ja yhdistä matriisi.
2. Lisää tarvittaessa kaavio, oletustilat ja ajastimet.
3. Käytä **Promode**-näkymää matriisin yhteyksien hallintaan.

## Matriisit

Valitse **Yhdistä uusi matriisi**, anna laitteen osoite ja tallenna asetukset. Yhdistetyt matriisit näkyvät Asetuksissa.

## Kaaviot ja oletustilat

Kaaviot helpottavat kokonaisuuden hahmottamista. Oletustilalla voit palauttaa matriisin ennalta määritettyihin yhteyksiin.

## Ongelmien ratkaisu

Jos yhteys ei muodostu, tarkista laitteen osoite ja verkkoyhteys. Promode näyttää ilmoituksen, jos matriiseja ei ole vielä yhdistetty.

<!-- en -->
# Help

Project source code: [GitHub / koodinikkarit / Taisto2](https://github.com/koodinikkarit/Taisto2)

Changes: [Changelog](https://github.com/koodinikkarit/Taisto2/blob/master/CHANGELOG.md)

Support: [atk-tuki@turunhelluntaisrk.fi](mailto:atk-tuki@turunhelluntaisrk.fi)

API reference: [API documentation](/api-docs)

## Chrome extension

[Download the Taisto Chrome extension (ZIP)](/static/taisto-chrome-extension.zip)

Extract the ZIP, open `chrome://extensions` in Chrome, enable **Developer mode**, and select **Load unpacked**. Choose the extracted folder containing `manifest.json`. In the extension, enter the Taisto server address and, if needed, a REST API key created under **Settings → API keys**. The extension lists diagrams and last-known display states and switches display inputs. The API key is stored only for the browser session and must be entered again after Chrome restarts. Switching without an API key requires temporarily enabled anonymous REST write access. API keys have broad REST write permissions. HTTP on a local network does not encrypt the key. The ZIP is included in tag-release Docker images and GitHub Releases.

For a local source checkout, the download link works only if the ZIP has separately been created in `public`. During development, select the project's `chrome-extension` folder directly.

After sending a switch command, the extension monitors the last state known to Taisto. The API does not provide its age, so a matching state does not guarantee a fresh device confirmation.

## Bitfocus Companion

[Download the Taisto Companion module (ZIP)](/downloads/taisto-companion.zip)

Extract the ZIP and select **Settings → Modules → Install module from local folder** in Companion. Configure the Taisto server address, port and a REST API key created in Settings. The module supports individual video connections, output-group execution and projector control.

## Projector

An admin enables the device under **Settings → Projector**. Use the projector host, port and control path from Companion, and make sure the Taisto server can reach that address.

Sign in and open **Projector** in the top navigation to see the reported power and source, switch inputs, freeze or blank the picture. **Toggle power** turns an off projector on and an on projector off. Check its state before confirming. Separate on/off buttons are available when model-specific codes are configured. Opening the page never sends a control command.

## Telegram

Create a bot with [BotFather](https://t.me/BotFather), enter its token under **Settings → Telegram**, and enable the bot. Wait for the status to show **Connected**, send `/id` to the bot in a private message, add the returned numeric user ID to the allowed users in settings, and save. Separate multiple IDs with commas. An empty allowlist blocks other commands. Control commands work only in private messages from allowed users.

`/status [page]` lists matrices (not their connection status), `/oletustilat [page]` lists default states, and `/suorita ID` executes one. `/nayttoryhmat [page]` lists groups, `/inputit GROUP_ID [page]` lists their allowed input IDs, and `/ryhma GROUP_ID INPUT_ID` switches the group to an input. Use the input ID from the listing, not the port number. A successful command means switching requests were queued, not that the matrix confirmed them. The bot skips messages queued at startup and does not execute switching commands delayed by more than two minutes.

Audit notifications can optionally be sent to a specified chat ID. The bot token is stored in plaintext in SQLite, but is not displayed in settings. Telegram settings are excluded from normal JSON exports and must be configured again after a JSON restore. Protect the database and its backups and secure settings with sign-in; never share the token.

Choose a trusted chat. Both the notifications and **Settings → Audit log** show who performed the action and the source IP seen by Taisto, when known. For Telegram commands, the sender’s Telegram ID is available, but Telegram does not provide the sender’s IP address to the bot.

Under **Settings → Telegram**, you can give an allowed ID a name such as *Room operator*. Changing or clearing the name affects only future audit entries and notifications. A name does not grant access: only the numeric Telegram ID does.

## Drive backups

Sign in as an administrator and open **Settings → Drive backups**. Check that both the Google OAuth credentials and the encryption key are configured on the server. Enter a private Drive folder ID, save, and select **Back up now**. Check the time and filename of the last successful backup; an accepted request does not mean the upload has finished. Enable the daily 03:00 Helsinki-time schedule separately.

The encrypted file contains the entire database, including users, keys, and the audit log. Keep a copy of the encryption key separate from Drive. Back up external configuration and credential files separately. See **Drive-varmuuskopiot** in the project README for setup and how to restore to a new file.

## Audit log

**Settings → Audit log** shows REST and UI changes, matrix video and KVM commands, the API key name, source address and request result. Retention is configured with the server environment variable `TAISTO_AUDIT_RETENTION_DAYS`; it defaults to 90 days and `0` disables automatic deletion. Times are displayed in the browser's local timezone. Passwords and API key values are never stored in the log.

## Users

Admins manage accounts under **Settings → Users**. An `admin` can change settings, while a `user` can operate diagrams, output groups, default states and Promode without access to Settings. The final database admin cannot be removed or demoted unless `TAISTO_PASSWORD` provides a replacement environment admin. The environment credential acts as a bootstrap and fallback whenever the database has no admin. Without database users or an environment password, the application remains available anonymously.

## Getting started

1. Open **Settings** and connect a matrix.
2. Add diagrams, default states and timers as needed.
3. Use **Promode** to manage matrix connections.

## Matrices

Select **Connect a new matrix**, enter the device address and save the settings. Connected matrices appear in Settings.

## Diagrams and default states

Diagrams make the setup easier to understand. A default state restores a matrix to its predefined connections.

## Troubleshooting

If a connection cannot be established, check the device address and network connection. Promode shows a message when no matrices have been connected yet.
