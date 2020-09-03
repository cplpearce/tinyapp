# lil'Links (aka tinyApp)
![lil'Links](https://nextcloud.ironmantle.ca/s/psdd2mDzWX2DTbr/preview)
#### So you have a lot of long links?
#### You need a fine little link shortener!
### It's called lil'Links!

##### What:
lil'Links is a link shortener that you run locally to create short links.  The shortlinks are tied to individual user accounts and include 1024bit password encryption, as well as cookie session management.

##### Who:
Included in the file is two hardcoded users to test features/functionality.  Please note their raw passwords are initially stored as unencrypted strings that become encrypted on initilzation.  However they should be removed if this app is ever moved to a domain.

In addition, there remains a debug endpoint [/debug] for...  Debugging.  Upon use of this app it would be advised to remove it or risk exposing the active shortened URLs.  Keep in mind as it stands there is no compromosing information, just strictly the urls, a masked user ID, and each links visits.

##### How:
First clone this to your local machine running Nodejs.  Then npm install the following:
* body-parser: "^1.19.0",
* cookie-session: "^1.4.0",
* ejs: "^3.1.5",
* express: "^4.17.1",
* quick-encrypt: "^1.0.8",
* serve-favicon: "^2.5.0"

##### Screen Shots:
### Login
![login](https://raw.githubusercontent.com/cplpearce/tinyapp/master/images/login.png)
### URL Index
![urlIndex](https://raw.githubusercontent.com/cplpearce/tinyapp/master/images/urlIndex.png)
### Register a new account
![register](https://raw.githubusercontent.com/cplpearce/tinyapp/master/images/register.png)
### Examine a URL
![examine](https://raw.githubusercontent.com/cplpearce/tinyapp/master/images/examine.png)
