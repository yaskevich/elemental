# Corpus Annotation Tool

Current Status: **Work In Progress **[Jan 2022]

The idea behind the project is to **provide a user-friendly and productive UI for rich text annotation**.
It started in 2018 as a manual Part-of-Speech tagging tool written in JQuery (data loader in Python 3 backed with SQLite).

As for now it is being rewritten in modern JavaScript – both client (Vue3) and server (NodeJS).

The project architecture changes. Current tasks include migrating from SQLite to PostgreSQL (completed) and extending the toolset with the interface for adding comments for text tokens. Rewriting the old client for PoS from JQuery to Vue3 is in the backlog as well.

So, the project does not have release-ready status yet. However, it is already in use for the projects of the [Center for Digital Humanities at HSE University](https://hum.hse.ru/en/digital/about/). 

If either you like the idea and would be happy to use the app as soon as possible, or you are ready to  contribute, or, maybe, you know the application that already exists and has all the functions like this, please, contact me via Github or mail me (@yaskevich).

#### Requirements

NodeJS v14+, PostgreSQL v9.6+

#### Setup and deployment

Technically, the platform consists of two applications: client and server. One has to install client packages, compile it and copy to server `public` directory, then install server packages, create a file with environmental variables (`.env`) and run the server application. 

This example of content of `.env` file:

```
PGUSER=database_user
PGHOST=127.0.0.1
PGPASSWORD=...................
PGDATABASE=annotation_database
PGPORT=5432
PORT=8080
JWT_SECRET=...................
```

The example setup script is in the file [deploy-elemental.sh](/deploy-elemental.sh)

Obviously, in production one should not use bare NodeJS instance, but a process manager.

I recommend [PM2](https://pm2.keymetrics.io) (there is a [config file](/server/ecosystem.config.cjs) for it).

#### Putting text into database

Unfortunately, there is still no UI for text uploading. 

At first, add text information (title, author, description, types of annotation) on Home screen.

Then, get *text ID* from `texts` table and execute:

`node server/converter.js <path> <2-character language code> <text ID>`

> *Path* is a path to text file. *Language code* is a two-character abbreviation (e.g. *en*, *ru*, *es*).

It is worth to mention that comments can be created without having a text in a database. Text is needed to attach comments to spans.



:space_invader:
