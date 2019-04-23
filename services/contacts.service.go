package services

import (
	"regexp"
	"strings"
	"time"

	"github.com/Rhymen/go-whatsapp"

	"github.com/moleculer-go/moleculer"
	db "github.com/moleculer-go/moleculer-db"
	"github.com/tidwall/gjson"
)

var Contacts = moleculer.ServiceSchema{
	Name: "contacts",
	Settings: map[string]interface{}{
		"fields": []string{
			"id", "name", "mobile", "jid",
			"deviceToken", "profilePicThumb", "status",
			"type", "group",
		},
	},
	Mixins: []moleculer.Mixin{db.Mixin(&db.MongoAdapter{
		MongoURL:   MongoURL,
		Collection: "contacts",
		Database:   "whatsapp",
		Timeout:    time.Second * 5,
	})},

	Events: []moleculer.Event{
		{
			Name:    "chat.remoteJid.received",
			Handler: onRemoteJidReceived,
		},
		{
			Name:    "contacts.jid.added",
			Handler: onContactAddedLoadContactInfo,
		},
	},
}

func getStatus(ctx moleculer.Context, wac *whatsapp.Conn, jid string) string {
	r, err := wac.GetStatus(jid)
	if err != nil {
		ctx.Logger().Error("Could not get status - error: ", err)
		return ""
	}
	return gjson.Get(<-r, "status").String()
}

func getProfilePicThumb(ctx moleculer.Context, wac *whatsapp.Conn, jid string) string {
	r, err := wac.GetProfilePicThumb(jid)
	if err != nil {
		ctx.Logger().Error("Could not GetProfilePicThumb - error: ", err)
		return ""
	}
	return gjson.Get(<-r, "eurl").String()
}

func getGroupInfo(ctx moleculer.Context, wac *whatsapp.Conn, jid string) map[string]interface{} {
	r, err := wac.GetGroupMetaData(jid)
	if err != nil {
		ctx.Logger().Error("Could not GetProfilePicThumb - error: ", err)
		return nil
	}

	json := <-r
	participants := parseParticipants(json)
	return map[string]interface{}{
		"id":           gjson.Get(json, "id").String(),
		"owner":        gjson.Get(json, "owner").String(),
		"subject":      gjson.Get(json, "subject").String(),
		"creation":     gjson.Get(json, "creation").Int(),
		"subjectTime":  gjson.Get(json, "subjectTime").Int(),
		"subjectOwner": gjson.Get(json, "subjectOwner").String(),
		"participants": participants,
	}
}

func parseParticipants(json string) []map[string]interface{} {
	r := []map[string]interface{}{}
	for _, item := range gjson.Get(json, "participants").Array() {
		r = append(r, map[string]interface{}{
			"id":           item.Get("id").String(),
			"isAdmin":      item.Get("isAdmin").Bool(),
			"isSuperAdmin": item.Get("isSuperAdmin").Bool(),
		})
	}
	return r
}

func numberFromJid(jid string) string {
	if jid == "" {
		return ""
	}
	return jid[:strings.Index(jid, "@")]
}

func onContactAddedLoadContactInfo(ctx moleculer.Context, params moleculer.Payload) {
	jid := params.Get("jid").String()
	ctx.Logger().Debug("[contacts.service] onContactAddedLoadContactInfo() ", jid)
	wac, _, err := validSession(ctx, params.Get("deviceToken").String())
	if err != nil {
		ctx.Logger().Error("Could not obtain a wap session! - error: ", err)
		return
	}

	update := map[string]interface{}{
		"id":              params.Get("contactId").String(),
		"mobile":          numberFromJid(jid),
		"status":          getStatus(ctx, wac, jid),
		"type":            contactType(jid),
		"group":           getGroupInfo(ctx, wac, jid),
		"profilePicThumb": getProfilePicThumb(ctx, wac, jid),
	}
	ctx.Logger().Debug("contacts.update - update: ", update)

	res := <-ctx.Call("contacts.update", update)
	if res.IsError() {
		ctx.Logger().Error("contacts.update - error: ", res.Error().Error())
	} else {
		ctx.Logger().Debug("contacts.update - Done! res: ", res)
	}
}

func contactType(jid string) string {
	matched, _ := regexp.MatchString(`\@g\.us`, jid)
	if matched {
		return "group"
	}
	matched, _ = regexp.MatchString(`\@s\.whatsapp\.net`, jid)
	if matched {
		return "person"
	}
	return "unknown"
}

func onRemoteJidReceived(ctx moleculer.Context, params moleculer.Payload) {
	remoteJid := params.Get("remoteJid").String()
	if remoteJid == "" {
		return
	}
	deviceToken := params.Get("deviceToken").String()
	ctx.Logger().Debug("[contacts.service] onRemoteJidReceived() remoteJid: ", remoteJid)
	r := <-ctx.Call("contacts.find", map[string]interface{}{
		"query": map[string]interface{}{
			"jid": remoteJid,
		},
	})
	if r.IsError() || r.Len() > 0 {
		//jid ja existe
		return
	}
	contact := <-ctx.Call("contacts.create", map[string]interface{}{
		"jid":         remoteJid,
		"deviceToken": deviceToken,
	})

	ctx.Broadcast("contacts.jid.added", map[string]interface{}{
		"jid":         remoteJid,
		"deviceToken": deviceToken,
		"contactId":   contact.Get("id").String(),
	})
}
