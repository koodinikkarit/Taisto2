# Taisto REST API

Tämä dokumentti kuvaa `/rest`-polkuun lisätyn REST-rajapinnan. Rajapinta tarjoaa samat ydintoiminnot kuin nykyinen GraphQL-kerros, mutta HTTP-resursseina. Kaikki vastaukset ovat JSON-muotoisia ja kaikki kirjoittavat kutsut edellyttävät `Content-Type: application/json` -otsikkoa.

## Yleiset periaatteet
- **Pohja-URL**: `http://<palvelin>:<portti>/rest`
- **Autentikointi**: ei oletuksena käytössä.
- **Virheformaatti**:
  ```json
  {
    "error": {
      "message": "Kuvaus virheestä",
      "details": [
        {
          "message": "Lisäkonteksti",
          "path": ["mahdollinen", "polku"]
        }
      ]
    }
  }
  ```
- **Statuskoodit**: 2xx onnistumisille, 4xx asiakkaan virheille (esim. puuttuva data, tuntematon resurssi) ja 5xx odottamattomille virheille.

## Resurssit

### Matriisit
| Metodi | Polku | Kuvaus |
| --- | --- | --- |
| `GET` | `/matrices` | Listaa kaikki matriisit portti- ja liitäntätietoineen. |
| `GET` | `/matrices/{id}` | Hakee matriisin tunnisteella. |
| `GET` | `/matrices/slug/{slug}` | Hakee matriisin tunnisteella (slug). |
| `POST` | `/matrices` | Luo uuden matriisin. Body: `{ "slug": "...", "ip": "...", "port": 5555, "conPortAmount": 16, "cpuPortAmount": 16 }`. |
| `PATCH` | `/matrices/{id}` | Päivittää matriisin kenttiä (samat avaimet kuin luonnissa). |
| `DELETE` | `/matrices/{id}` | Poistaa matriisin ja siihen liittyvät portit. |
| `PATCH` | `/con-ports/{id}` | Päivittää ohjausportin slug-kentän. Body: `{ "slug": "Ohjaus 1" }`. |
| `GET` | `/con-ports/{id}/video-connection` | Palauttaa ohjausportin (con) viimeksi tunnetun videokytkennän. |
| `POST` | `/con-ports/{id}/video-connection` | Vaihtaa ohjausportin (con) videolähteen. Body: `{ "cpuPort": "<cpuPortId>" }`. |
| `DELETE` | `/con-ports/{id}/video-connection` | Katkaisee ohjausportin (con) videokytkennän. |
| `PATCH` | `/cpu-ports/{id}` | Päivittää CPU-portin slug-kentän. Body: `{ "slug": "Työpiste 1" }`. |
| `POST` | `/cpu-ports/{id}/kwm-connection` | Vaihtaa CPU-portin KWM-kytkennän. Body: `{ "conPort": "<conPortId>" }`. |
| `DELETE` | `/cpu-ports/{id}/kwm-connection` | Katkaisee CPU-portin KWM-kytkennän. |

### Kaaviot
| Metodi | Polku | Kuvaus |
| --- | --- | --- |
| `GET` | `/diagrams` | Listaa kaikki kaaviot ja niiden näytöt. |
| `GET` | `/diagrams/{id}` | Hakee kaavion tunnisteella. |
| `GET` | `/diagrams/slug/{slug}` | Hakee kaavion slugilla. |
| `POST` | `/diagrams` | Luo kaavion. Body: `{ "slug": "Uusi kaavio" }`. |
| `PATCH` | `/diagrams/{id}` | Päivittää kaavion slug-kentän. |
| `DELETE` | `/diagrams/{id}` | Poistaa kaavion ja sen näytöt. |

### Kaavion näytöt
| Metodi | Polku | Kuvaus |
| --- | --- | --- |
| `GET` | `/diagram-screens` | Listaa kaikki kaavion näytöt. |
| `GET` | `/diagram-screens/{id}` | Hakee näytön tunnisteella. |
| `GET` | `/diagram-screens/slug/{slug}` | Hakee näytön slugilla. |
| `POST` | `/diagram-screens` | Luo näytön. Body: `{ "diagram": "<diagramId>", "slug": "Näyttö A", "conPort": "<conPortId>", "matrix": "<matrixId>" }`. |
| `PATCH` | `/diagram-screens/{id}` | Päivittää näytön slug-, conPort- tai matrix-kentät. |
| `POST` | `/diagram-screens/{id}/cpus` | Liittää CPU-portin näyttöön. Body: `{ "cpuPort": "<cpuPortId>" }`. |
| `DELETE` | `/diagram-screens/{id}/cpus/{cpuPortId}` | Irrottaa CPU-portin näytöstä. |
| `DELETE` | `/diagram-screens/{id}` | Poistaa näytön ja siihen liittyvät portit. |

### Oletustilat
| Metodi | Polku | Kuvaus |
| --- | --- | --- |
| `GET` | `/default-states` | Listaa oletustilat yhteyksineen. |
| `GET` | `/default-states/{id}` | Hakee oletustilan tunnisteella. |
| `GET` | `/default-states/slug/{slug}` | Hakee oletustilan slugilla. |
| `POST` | `/default-states` | Luo oletustilan. Body: `{ "slug": "Aamu", "matrix": "<matrixId>" }`. |
| `DELETE` | `/default-states/{id}` | Poistaa oletustilan ja sen kytkennät. |
| `POST` | `/default-states/{id}/video-connections` | Lisää videokytkennän oletustilaan. Body: `{ "conPort": "<conPortId>", "cpuPort": "<cpuPortId>" }`. |
| `DELETE` | `/default-states/{id}/video-connections/{conPortId}` | Poistaa videokytkennän oletustilasta. |
| `POST` | `/default-states/{id}/kwm-connections` | Lisää KWM-kytkennän oletustilaan. Body: `{ "conPort": "<conPortId>", "cpuPort": "<cpuPortId>" }`. |
| `DELETE` | `/default-states/{id}/kwm-connections/{cpuPortId}` | Poistaa KWM-kytkennän oletustilasta. |
| `POST` | `/default-states/{id}/execute` | Suorittaa oletustilan välittömästi. Vastaa 202-statuksella. |

### Viikkotimerit
| Metodi | Polku | Kuvaus |
| --- | --- | --- |
| `GET` | `/weekly-timers` | Listaa viikkotimerit ja niiden kytkennät. |
| `GET` | `/weekly-timers/{id}` | Hakee viikkotimerin tunnisteella. |
| `GET` | `/weekly-timers/slug/{slug}` | Hakee viikkotimerin slugilla. |
| `POST` | `/weekly-timers` | Luo viikkotimerin. Body: `{ "slug": "Aamu" }` (slug on vapaaehtoinen). |
| `PATCH` | `/weekly-timers/{id}` | Päivittää kenttiä (`slug`, `minutes`, `hours`, `active`, `monday` … `sunday`). |
| `DELETE` | `/weekly-timers/{id}` | Poistaa viikkotimerin ja sen kytkennät. |
| `POST` | `/weekly-timers/{id}/video-connections` | Lisää videokytkennän. Body: `{ "conPort": "<conPortId>", "cpuPort": "<cpuPortId>" }`. |
| `DELETE` | `/weekly-timers/{id}/video-connections/{conPortId}` | Poistaa videokytkennän. |
| `POST` | `/weekly-timers/{id}/kwm-connections` | Lisää KWM-kytkennän. Body: `{ "conPort": "<conPortId>", "cpuPort": "<cpuPortId>" }`. |
| `DELETE` | `/weekly-timers/{id}/kwm-connections/{cpuPortId}` | Poistaa KWM-kytkennän. |
| `POST` | `/weekly-timers/{id}/default-states` | Liittää oletustilan. Body: `{ "defaultState": "<defaultStateId>" }`. |
| `DELETE` | `/weekly-timers/{id}/default-states/{defaultStateId}` | Poistaa oletustilan liitoksen. |

## Esimerkit

### Luo matriisi
```http
POST /rest/matrices
Content-Type: application/json

{
  "slug": "sali",
  "ip": "192.168.0.10",
  "port": 5555,
  "conPortAmount": 16,
  "cpuPortAmount": 16
}
```

**Vastaus 201**
```json
{
  "id": "1",
  "slug": "sali",
  "ip": "192.168.0.10",
  "port": 5555,
  "conPortAmount": 16,
  "cpuPortAmount": 16,
  "conPorts": [ ... ],
  "cpuPorts": [ ... ]
}
```

### Poista oletustilan videokytkentä
```http
DELETE /rest/default-states/3/video-connections/8
```

**Vastaus 204**

### Hae ohjausportin videokytkentä
```http
GET /rest/con-ports/35/video-connection
```

**Vastaus 200**
```json
{
  "conPort": { "id": "35", "slug": "Näyttö 1", "portNum": 1 },
  "cpuPort": { "id": "37", "slug": "PC 5", "portNum": 5 },
  "status": "connected"
}
```

`status`-arvot:
- `connected`: con-portti on kytketty CPU-porttiin.
- `disconnected`: con-portti on katkaistu.
- `unknown`: tilaa ei ole vielä saatu (esim. matriisi ei ole vastannut tilakyselyyn).

### Bitfocus Companion -esimerkki (Generic HTTP)
Seuraava esimerkki näyttää, miten REST‑rajapintaa käytetään Companionissa sekä actioniin että feedbackiin.

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

**Feedback‑logiikka (esimerkki)**
- Väri:
  - `status == "connected"` -> vihreä
  - `status == "disconnected"` -> punainen/harmaa
  - `status == "unknown"` -> keltainen/harmaa
- Teksti:
  - `status == "connected"` -> `CPU {cpuPort.portNum}` tai `cpuPort.slug`
  - Muulloin -> `Ei kytkentää`

**Performance note**
- Jos käytössä on paljon nappeja, käytä pidempää pollausväliä (esim. 1000–2000 ms) tai ryhmittele napit, jotta REST-kutsujen määrä pysyy kohtuullisena.

Rajapinta käyttää taustalla samaa GraphQL-skeemaa, joten data- ja liiketoimintasäännöt pysyvät yhdenmukaisina olemassa olevan käyttöliittymän kanssa.
