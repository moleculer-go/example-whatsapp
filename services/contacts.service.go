package services

import (
	"time"

	db "github.com/moleculer-go/moleculer-db"

	"github.com/moleculer-go/moleculer"
)

var Contacts = moleculer.Service{
	Name: "contacts",
	Settings: map[string]interface{}{
		"fields": []string{"id", "name", "mobile", "whatsAppId", "deviceToken"},
	},
	Mixins: []moleculer.Mixin{db.Mixin(&db.MongoAdapter{
		MongoURL:   MongoURL,
		Collection: "contacts",
		Database:   "whatsapp",
		Timeout:    time.Second * 5,
	})},
}
