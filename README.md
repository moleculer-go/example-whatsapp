## Moleculer Go Examples

# WhatsApp Example App

A friend needed a whatsapp app to automate some of his social media campaings, I thought would be great to help him and at the same time help Moleculer Go with on more example app :)

So here it is.

I'm using the following components in this project:

- whatsapp lib: https://github.com/go-whatsapp
- UI: React with Next.js
- UI Theme: https://mdbootstrap.com/docs/react/components/demo/

## Development Mode
1. install js dependencies
```
npm install
```

2. start next js server in dev mode
```
npm run dev
```
Output should be:
```
Compiled successfully!

  > Ready on http://localhost:3000

Note that pages will be compiled when you first load them.
```

3. start services with gateway reverse proxy :)
* NOTE: * you need Go 1.11 or higher with support to go modules :)
```
cd cli
go run whatsapp_service.go start --env=dev
```

This will start moleculer, with all the services defined in the file whatsapp_service.go:
```
broker.Publish(gatewaySvc, services.Login, services.Chat, services.Session, services.Contacts)
```
It will be in dev mode and our configuration has a reserse proxy :) so UI static content (html, css, js and etc) is served from the same domain as you data, your api. Avoid CORS issues in your dev environment.


## Running tests
From the root folder:
```
go test ./...
```
