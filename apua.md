<!-- fi -->
# Apua

Projektin lähdekoodi: [GitHub / koodinikkarit / Taisto2](https://github.com/koodinikkarit/Taisto2)

Muutokset: [Changelog](https://github.com/koodinikkarit/Taisto2/blob/master/CHANGELOG.md)

Tuki: [atk-tuki@turunhelluntaisrk.fi](mailto:atk-tuki@turunhelluntaisrk.fi)

Rajapintadokumentaatio: [API-dokumentaatio](/api-docs)

## Bitfocus Companion

[Lataa Taisto Companion -moduuli (ZIP)](/downloads/taisto-companion.zip)

Pura ZIP-tiedosto ja valitse Companionissa **Settings → Modules → Install module from local folder**. Moduulin asetuksiin annetaan Taisto-palvelimen osoite, portti ja Asetukset-sivulla luotu REST API-avain. Moduuli tukee yksittäisiä videokytkentöjä, output-ryhmien suorittamista sekä projektorin ohjausta.

## Audit-loki

**Asetukset → Audit-loki** näyttää REST- ja käyttöliittymämuutokset, matriisin video- ja KVM-ohjaukset, API-avaimen nimen, lähdeosoitteen sekä pyynnön onnistumisen. Säilytysaika asetetaan palvelimen ympäristömuuttujalla `TAISTO_AUDIT_RETENTION_DAYS`; oletus on 90 päivää ja arvo `0` estää automaattisen poistamisen. Ajat näytetään selaimen paikallisessa ajassa. Salasanoja tai API-avainten sisältöä ei tallenneta lokiin.

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

## Bitfocus Companion

[Download the Taisto Companion module (ZIP)](/downloads/taisto-companion.zip)

Extract the ZIP and select **Settings → Modules → Install module from local folder** in Companion. Configure the Taisto server address, port and a REST API key created in Settings. The module supports individual video connections, output-group execution and projector control.

## Audit log

**Settings → Audit log** shows REST and UI changes, matrix video and KVM commands, the API key name, source address and request result. Retention is configured with the server environment variable `TAISTO_AUDIT_RETENTION_DAYS`; it defaults to 90 days and `0` disables automatic deletion. Times are displayed in the browser's local timezone. Passwords and API key values are never stored in the log.

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
