# FlowerCAT

Corpus Annotation Tool &mdash; for tagging tokens and adding comments to them.

Current Status: Alpha / Work In Progress [June 2022]

It is **experimental** project and it is being redesigned during development and testing.

The idea behind it is **providing a user-friendly and productive UI for rich text annotation**.

-------------------------

It started in 2018 as a manual Part-of-Speech tagging tool written in JQuery (data loader in Python 3) backed with SQLite. As for now it is being rewritten in modern JavaScript – both client (Vue3) and server (NodeJS). The project architecture changes. Current tasks include migrating from SQLite to PostgreSQL (completed) and extending the toolset with the interface for adding comments for text tokens. Rewriting the old client for PoS from JQuery to Vue3 is in the backlog as well. However, development of the UI for commenting has high priority, while implementation of PoS toolset is postponed.

So, the project does not have release-ready status yet, but it is already in use for the projects of the [Center for Digital Humanities at the HSE University](https://hum.hse.ru/en/digital/about/).

If you would like to contribute or to test the tool on your data, fell free to contact me via Github ([@yaskevich](https://github.com/yaskevich)) or [mail me](https://yaskevich.com/).

### Requirements

NodeJS v14+, PostgreSQL v12+

Development setup: Linux, NodeJS v16, PostgreSQL v12

### Setup and deployment

Technically, the platform consists of two applications: client and server. One has to install client packages, compile client application and copy it to server `public` directory, then install server packages, create a file with environmental variables (`.env`) and run the server application. 

This example of content of `.env` file:

```
# PostgreSQL user
PGUSER=database_user
# PostgreSQL host (IP or hostname)
PGHOST=127.0.0.1
# PostgreSQL password
PGPASSWORD=...................
# PostgreSQL database
PGDATABASE=annotation_database
# PostgreSQL port
PGPORT=5432
# Application port
# If not set, default value is used (8080)
PORT=8080
# Secret Key for JSON Web Token (must be random)
JWT_SECRET=...................
# Size limit for image files (in bytes)
# If not set, default value is used (1 Mb)
IMGLIMIT=1024000
```

The example setup script is in [deploy.sh](/deploy.sh)

Obviously, in production environment one should not use bare NodeJS instance, but a process manager. I recommend [PM2](https://pm2.keymetrics.io), there is a [config file](/server/ecosystem.config.cjs) for it.

### Putting text into database

NB: text is needed only to bind comments to tokens. One can start adding comments without having a text in a database (that could be made later). 

Currently, client interface for text uploading is under development. Although it is possible to put text into database via command line.

1. Setup the platform.
2. Fill new text card in Home screen and save it. 
3. Obtain <u>text ID</u>. If it is clean setup, then, obviously, the ID number of your only text is 1. 
   You could check it: either look into `texts` table of your database, or via UI  — go to Home screen and click text title: you'll find the number in browser address bar.
4. Execute (on a server where the platform is deployed): 
   `node server/converter.js <path> <2-character language code> <text ID>`
   where *path* is a path to your text file. *Language code* is a two-character abbreviation (e.g. *en*, *ru*, *es*). 
   Example:
   `node server/converter.js /home/user/essay.txt en 1`

### Trivia

Initial version of the project was interactive manual *grammar* tagger for Belarusian text called **grammaticon** (2018). More functional and usable prototype (2020) was named **elemental** (2020), as it rendered text as a sequence of *elements* of different types. Since June 2022 it is branded as **flowercat**, because it became more multifunctional corpus annotation tool and other more straightforward names as *supercat*, *textcat* etc. were already occupied. So I had to use my imagination 🙂️ Also the application provides processing *flow*.




:space_invader:
