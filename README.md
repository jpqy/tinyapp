# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly). It was built as part of Lighthouse Labs' Web Development bootcamp.

## Screenshots

!["Manage URLs Page"](https://i.imgur.com/pbpuAFK.png)
!["URL Details Page"](https://i.imgur.com/cllDgY0.png)
!["Hottest Links Page"](https://i.imgur.com/aWRGnZP.png)


## Dependencies

- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session
- method-override

## Stretch (Bonus) Features

- Can serve app in a subdirectory such as example.com/tinyapp
* [x] Analytics
  * [x] Keeps track of how many times a given short URL is visited
  * [x] Keeps track of unique visitors for each URL
  * [x] Keeps track of every visit (timestamp, and a generated visitor_id), displayed on the URL edit page
- Has a 'Hot' page with the most popular short URLs

## Getting Started

- Install all dependencies (using the `npm install` command)
- If serving the app in a subdirectory (i.e. example.com/tinyapp), set the environmental variable `TINYAPP_BASE_URL` appropriately (i.e. /tinyapp/)
- (Optional) Set server port with environmental variable `TINYAPP_PORT` (default is 8080)
- Run the development web server using the command `node express_server.js` with your favourite service manager