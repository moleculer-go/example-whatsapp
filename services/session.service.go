package services

import (
	"time"

	db "github.com/moleculer-go/moleculer-db"

	"github.com/moleculer-go/moleculer"
)

var MongoURL = "mongodb+srv://app:bluesky@cluster0-mv6gv.mongodb.net/test?retryWrites=true"

var Session = moleculer.Service{
	Name: "session",
	Settings: map[string]interface{}{
		"fields": []string{"id", "deviceToken", "content"},
	},
	Mixins: []moleculer.Mixin{db.Mixin(&db.MongoAdapter{
		MongoURL:   MongoURL,
		Collection: "session",
		Database:   "whatsapp",
		Timeout:    time.Second * 5,
	})},
}
