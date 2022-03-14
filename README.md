# Cypress Ranch Access Point

The Cypress Ranch Access Point or CRAP for short is an application built by Davinderpal Toor to replace the outdated "Cypress Woods" app that was well-known for its compatability with HomeAccess Center grades.

Since the district switched to a mandatory my.cfisd login in order to access HAC, no prior application is currently working which is where this comes in.

## Purpose
To give clients their grades with as much speed as possible.
## Frameworks
* Express - The server that receives requests.
* Express-rate-limit - A rate limiter to prevent API abuse.
* node-fetch - A fetch API used to create elegant fetch requests in Node.
* playwright - Scrapes the my.cfisd login, app selection, and HAC pages in order to get all the grades.
* worker-farm - Allows multi-processing which helps to avoid blockage.

## Pictures
TBD
## Credits
* Shrivu Shankar - Gave me the idea to use Ionic to develop the mobile application.
