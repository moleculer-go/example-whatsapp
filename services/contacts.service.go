package services

import (
	"regexp"
	"strings"
	"time"

	"github.com/moleculer-go/go-whatsapp"

	"github.com/moleculer-go/moleculer"
	"github.com/moleculer-go/store"
	"github.com/moleculer-go/store/mongo"
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
	Mixins: []moleculer.Mixin{store.Mixin(&mongo.MongoAdapter{
		MongoURL:   MongoURL,
		Collection: "contacts",
		Database:   "whatsapp",
		Timeout:    time.Second * 5,
	})},

	Events: []moleculer.Event{
		{
			Name:    "login.success",
			Handler: loadContacts,
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

func fetchContact(ctx moleculer.Context, deviceToken string, contact whatsapp.Contact) (map[string]interface{}, error) {
	wac, _, err := validSession(ctx, deviceToken)
	if err != nil {
		ctx.Logger().Error("Could not obtain a wap session! - error: ", err)
		return map[string]interface{}{}, err
	}
	jid := contact.Jid
	cType := contactType(jid)
	ctx.Logger().Debug("[contacts.service]  fetchContact() cType ", cType)

	info := map[string]interface{}{
		"jid":             jid,
		"name":            contact.Name,
		"short":           contact.Short,
		"notify":          contact.Notify,
		"deviceToken":     deviceToken,
		"mobile":          numberFromJid(jid),
		"status":          getStatus(ctx, wac, jid),
		"type":            cType,
		"profilePicThumb": getProfilePicThumb(ctx, wac, jid),
	}
	ctx.Logger().Debug("[contacts.service]  fetchContact() info ", info)

	if cType == "group" {
		info["group"] = getGroupInfo(ctx, wac, jid)
	}
	return info, nil
}

// func onContactAddedLoadContactInfo(ctx moleculer.Context, params moleculer.Payload) {
// 	jid := params.Get("jid").String()
// 	deviceToken := params.Get("deviceToken").String()
// 	contactId := params.Get("contactId").String()
// 	ctx.Logger().Debug("[contacts.service] onContactAddedLoadContactInfo() jid: ", jid, " contactId: ", contactId)

// 	update, err := fetchContact(ctx, deviceToken, jid)
// 	if err != nil {
// 		ctx.Logger().Error("Could not fetch contact details - error: ", err)
// 		return
// 	}

// 	update["id"] = contactId
// 	ctx.Logger().Debug("contacts.update - jid: ", jid, " update: ", update)

// 	res := <-ctx.Call("contacts.update", update)
// 	if res.IsError() {
// 		ctx.Logger().Error("contacts.update - error: ", res.Error().Error())
// 	} else {
// 		ctx.Logger().Debug("contacts.update - Done! res: ", res)
// 	}
// }

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

func contactExists(ctx moleculer.Context, jid string) bool {
	r := <-ctx.Call("contacts.find", map[string]interface{}{
		"query": map[string]interface{}{"jid": jid},
	})
	ctx.Logger().Debug("contactExists() r: ", r)
	return !r.IsError() && r.Len() > 0
}

func createContact(ctx moleculer.Context, deviceToken string, contact whatsapp.Contact) {
	ctx.Logger().Debug("[contacts.service] createContact() jid: ", contact.Jid)
	exists := contactExists(ctx, contact.Jid)
	ctx.Logger().Debug("[contacts.service] exists: ", exists)
	if exists {
		ctx.Logger().Debug("[contacts.service] createContact() SKIPING contact already exists!  jid: ", contact.Jid)
		return
	}
	ctx.Logger().Debug("[contacts.service] before fetchContact() ")

	data, err := fetchContact(ctx, deviceToken, contact)
	ctx.Logger().Debug("[contacts.service] fetchContact() data: ", data, " err: ", err)

	if err != nil {
		ctx.Logger().Error("Could not fetch contact details - error: ", err)
		return
	}
	ctx.Logger().Debug("[contacts.service] before  contacts.create ")

	res := <-ctx.Call("contacts.create", data)
	ctx.Logger().Debug("[contacts.service] contacts.create res: ", res)

	data["id"] = res.Get("id").String()
	ctx.Broadcast("contacts.added", data)
}

func loadContacts(context moleculer.Context, params moleculer.Payload) {
	context.Logger().Debug("[contacts.service] loadContacts() !")
	deviceToken := params.Get("deviceToken").String()
	wac, _, err := validSession(context, deviceToken)
	if err != nil {
		context.Logger().Error("Could not obtain a wap session! - error: ", err)
		return
	}
	context.Logger().Debug("[contacts.service] Before wac.Contacts() ")

	_, err = wac.Contacts()
	context.Logger().Debug("[contacts.service] wac.Store.Contacts ", wac.Store.Contacts)
	for _, contact := range wac.Store.Contacts {
		go createContact(context, deviceToken, contact)
	}
}
