# FlowerCAT

Corpus Annotation Tool &mdash; for tagging tokens and adding comments to them. Current direction of development is towards building an up-to-date platform for maintaining and publishing commented **digital editions**. However, the main idea behind the project is **providing a user-friendly and productive UI for any type of text annotation**.

### Status 

`Beta / Work In Progress [September 2022]`

The code base is still in **experimental** phase and it is being redesigned during development and testing. Although the application does not have release-ready status yet, it is already in use in the [Center for Digital Humanities](https://hum.hse.ru/en/digital/about/) at the HSE University.

Questions? Ideas? PRs? Feel free to create an issue on Github or [contact me](https://yaskevich.com/) directly.

### Development

It started in 2018 as a manual Part-of-Speech tagging tool written in JQuery (data loader in Python 3) backed with SQLite. As for now it is being rewritten in modern JavaScript – both client (Vue3/TypeScript) and server (NodeJS). The project architecture changes. Current tasks include migrating from SQLite to PostgreSQL (*completed*) and extending the toolset with the interface for adding comments for text tokens (*high priority*). Rewriting the old client for PoS from JQuery to Vue3 is in the backlog as well (*postponed*).

### Requirements

NodeJS v14+, PostgreSQL v12+

Development setup: Linux, NodeJS v16, PostgreSQL v12

### Setup and deployment

Technically, the platform consists of two applications: client and server. One has to install client packages, compile client application and copy it into server `public` directory, then install server packages, set environmental variables (the easiest way is by creating `.env` file in project root directory) and run the server application.

This example of the content of `.env` file:

```
# PostgreSQL user
PGUSER=flowercat_user
# PostgreSQL host (IP or hostname)
PGHOST=127.0.0.1
# PostgreSQL password
PGPASSWORD=...................
# PostgreSQL database
PGDATABASE=flowercat_database
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
# Size limit for text content (in bytes)
# If not set, default value is used (10 Mb)
TXTLIMIT=10240000
```

The example setup script is in [deploy.sh](/deploy.sh).

Obviously, in production environment one should use rather a process manager, than a bare NodeJS instance. I recommend [PM2](https://pm2.keymetrics.io), there is a [config file](/server/ecosystem.config.cjs) for it. Also, one can pass the environmental variables in any other manner: via Docker config, via PM2 config, etc.

<details>
  <summary>Trivia</summary>

Initial version of the project was interactive manual *grammar* tagger for Belarusian text called **grammaticon** (2018). More functional and usable prototype (2020) was named **elemental** (2020), as it rendered text as a sequence of *elements* of different types. Since June 2022 it is branded as **flowercat**, because it became more multifunctional corpus annotation tool and other more straightforward names as *supercat*, *textcat* etc. were already occupied. So I had to use my imagination 🙂️ Also the application provides processing *flow*.

</details>


:space_invader:
