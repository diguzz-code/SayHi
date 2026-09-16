# SayHi!

SayHi è una web app chatbot sviluppata in JavaScript come Project Work per Zucchetti Academy, nell'ambito del corso "Introduzione alla programmazione con JavaScript, focus: Intelligenza Artificiale".

L'applicazione permette di conversare con un assistente AI attraverso un'interfaccia moderna, composta da una sidebar delle conversazioni, un'area messaggi e una barra di input.

## Funzionalità

- Invio messaggi tramite la barra in basso (Invio per inviare, Shift + Invio per andare a capo)
- Creazione di una nuova chat dalla sidebar
- Ricerca delle conversazioni per titolo
- Rinomina ed eliminazione delle chat
- Copia e rigenerazione delle risposte del bot
- Impostazioni grafiche: tema chiaro/scuro, movimento sfondo, colore accento

## Requisiti

- Browser moderno (Chrome, Edge o Firefox)
- Connessione Internet attiva, necessaria per Puter.js e per il modello AI
- Consigliato: Visual Studio Code con estensione Live Server
- Login a Puter, se richiesto, per autorizzare l'uso dell'AI

## Avvio

1. Aprire la cartella del progetto
2. Aprire `index.html` nel browser oppure avviarlo tramite Live Server
3. Attendere il caricamento dell'interfaccia
4. Scrivere una domanda nella barra in basso e premere Invio o il pulsante di invio

## Struttura del progetto

nome_progetto.zip
├── index.html
├── index.js
├── analisi.pdf
├── manuale_utente.pdf
├── img/
├── css/
└── altro/


## Esempi di domande

- Quanto fa 2+2?
- Chi è la casa produttrice di The Witcher 3?
- Chi era Dante Alighieri?

## Risoluzione problemi

- Se il bot non risponde: controllare la connessione Internet e ricaricare la pagina
- Se compare un errore AI: premere Rigenera o riprovare dopo qualche secondo
- Se le icone non si vedono: verificare che il CDN Lucide sia raggiungibile
- Se l'AI non parte aprendo il file direttamente: usare VS Code con Live Server

## Validazione

Per verificare il progetto è sufficiente aprire `index.html`, inviare alcune domande libere e controllare che il bot risponda tramite modello AI. Si consiglia di testare anche nuova chat, copia, rigenera e impostazioni grafiche.

## Stack tecnologico

- JavaScript
- HTML5 e CSS3
- Puter.js per l'interazione con il modello AI
- Lucide per le icone (via CDN)

## Contesto didattico

Project Work realizzato per Zucchetti Academy seguendo quattro step: analisi, codifica, test e consegna. I documenti `analisi.pdf` e `manuale_utente.pdf` accompagnano il codice e sono inclusi nella cartella di progetto.
