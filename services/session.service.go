package services

import (
	"time"

	db "github.com/moleculer-go/moleculer-db"

	"github.com/moleculer-go/moleculer"
)

//var MongoURL = "mongodb://app:bluesky@cluster0-shard-00-00-mv6gv.mongodb.net:27017,cluster0-shard-00-01-mv6gv.mongodb.net:27017,cluster0-shard-00-02-mv6gv.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true"
var MongoURL = "mongodb://localhost:27017"

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
