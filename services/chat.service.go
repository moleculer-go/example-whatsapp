package services

import (
	"fmt"
	"time"

	"github.com/Rhymen/go-whatsapp"
	"github.com/moleculer-go/moleculer"
	"github.com/moleculer-go/moleculer/payload"
)

var Chat = moleculer.ServiceSchema{
	Name: "chat",
	Actions: []moleculer.Action{
		{
			Name: "sendMessage",
			Handler: func(ctx moleculer.Context, params moleculer.Payload) interface{} {
				deviceToken := params.Get("deviceToken").String()
				wac, _, err := validSession(ctx, deviceToken)
				if err != nil {
					ctx.Logger().Error("Cannot send message - connection error: ", err)
					return payload.Error("Cannot send message - connection error: ", err)
				}
				message := params.Get("message").String()
				target := params.Get("target").String()

				err = wac.Send(whatsapp.TextMessage{
					Info: whatsapp.MessageInfo{
						RemoteJid: target + "@s.whatsapp.net",
					},
					Text: message,
				})
				if err != nil {
					ctx.Logger().Error("error sending message: ", err)
					return payload.Error("Cannot send message! - error: ", err.Error())
				}
				return map[string]interface{}{
					"result": "message sent",
				}
			},
		},
	},

	Events: []moleculer.Event{
		{
			Name:    "login.success",
			Handler: onLoginSuccess,
		},
		{
			Name:    "contacts.jid.added",
			Handler: onContactAddedLoadMessages,
		},
	},
}

func onLoginSuccess(context moleculer.Context, params moleculer.Payload) {
	context.Logger().Debug("[chat.service] onLoginSuccess() - adding message handler!")
	deviceToken := params.Get("deviceToken").String()
	wac, _, err := validSession(context, deviceToken)
	if err != nil {
		context.Logger().Error("Could not obtain a wap session! - error: ", err)
		return
	}
	wac.AddHandler(&waHandler{wac, context, deviceToken})
}

type waHandler struct {
	c           *whatsapp.Conn
	context     moleculer.Context
	deviceToken string
}

//HandleError needs to be implemented to be a valid WhatsApp handler
func (h *waHandler) HandleError(err error) {
	if e, ok := err.(*whatsapp.ErrConnectionFailed); ok {
		fmt.Printf("Connection failed, underlying error: %v", e.Err)
		fmt.Println("Waiting 30sec...")
		<-time.After(30 * time.Second)
		fmt.Println("Reconnecting...")
		err = h.c.Restore()
	}
	if err == nil {
		return
	}
	h.context.Emit("chat.error", payload.New(err))
}

func (h *waHandler) HandleTextMessage(message whatsapp.TextMessage) {
	h.context.Logger().Debugf("[Message received]:  %v %v %v %v\n\t%v\n",
		message.Info.Timestamp,
		message.Info.Id,
		message.Info.RemoteJid,
		message.Info.QuotedMessageID,
		message.Text)

	h.context.Broadcast("chat.remoteJid.received", map[string]interface{}{
		"remoteJid":   message.Info.RemoteJid,
		"deviceToken": h.deviceToken,
	})
	h.context.Broadcast("chat.message.received", map[string]interface{}{
		"deviceToken":     h.deviceToken,
		"timestamp":       message.Info.Timestamp,
		"id":              message.Info.Id,
		"remoteJid":       message.Info.RemoteJid,
		"quotedMessageID": message.Info.QuotedMessageID,
		"text":            message.Text,
	})
}

func onContactAddedLoadMessages(ctx moleculer.Context, params moleculer.Payload) {
	jid := params.Get("jid").String()
	ctx.Logger().Debug("[chat.service] onContactAdded() ", jid)
	wac, _, err := validSession(ctx, params.Get("deviceToken").String())
	if err != nil {
		ctx.Logger().Error("Could not obtain a wap session! - error: ", err)
		return
	}
	nd, err := wac.LoadMessages(jid, "", 0)
	if err != nil {
		ctx.Logger().Error("Could not load msgs - error: ", err)
		return
	}
	ctx.Logger().Debug("[chat.service] onContactAdded() -> nd.Content type ", fmt.Sprintf("%T", nd.Content))

	// list, ok := nd.Content.([]map[string]interface{})
	// if ok {
	// 	for _, item := range list {
	// 		key := item["key"]
	// 		messageTimestamp := item["key"]
	// 		messageStubType := item["messageStubType"]
	// 		message := item["message"]

	// 	}
	// }

	//
	// key:
	// 	<
	// 		remoteJid:"64212303774@s.whatsapp.net"
	// 		fromMe:false id:"3A33A89A706023DF3901"
	// 	>
	// messageTimestamp:1518121603
	// messageStubType:E2E_ENCRYPTED
	//
	// key:
	// 	<
	// 		remoteJid:"64212303774@s.whatsapp.net"
	// 		fromMe:true id:"3A5702BC01A9B713F9FA"
	// 	>
	// message:<conversation:"Nice" >
	// messageTimestamp:1518206421
	// status:DELIVERY_ACK

	// key:
	// 	<
	// 		remoteJid:"64212303774@s.whatsapp.net"
	// 		fromMe:true id:"3AEC6C44EA836B1ED1BF"
	// 	>
	// message:
	// 	<
	// 		imageMessage:
	// 			<
	// 				url:"https://mmg-fna.whatsapp.net/d/f/AnTiU1Fe6OruTe7qYDfDnq257NY0KrTx1Bg5n9IyfW1B.enc"
	// 				mimetype:"image/jpeg"
	// 				fileSha256:"\232\347b\271\013\036\257\037\0011\n\332\323h\375{\262.\206\236\325\316\216pi\262~d0F\177!"
	// 				fileLength:151001
	// 				height:768
	// 				width:1024
	// 				mediaKey:"\370k}0\3669\377\372\221\316r\243\rV\351[\241\321Q\372\002\377-\314t\177\261a\205\312\247\203"
	// 				fileEncSha256:"\034/k\367\303/\305\217\334\336\216\304'\327\375t\020j\324\376\374Q\313-/\326NT\032u\335\262"
	// 				directPath:"/v/t62.7118-24/18857570_602718326763621_4079619794686924526_n.enc?oh=55af8aedbe37fe44ca5454fdf473aae6&oe=CCF801DA"
	// 				jpegThumbnail:"binary... \377\330\37 ... "
	// 			>
	// 	>
	// messageTimestamp:1527235333
	// status:DELIVERY_ACK
	// multicast:true

	// key:
	// 	<
	// 		remoteJid:"64212303774@s.whatsapp.net"
	// 		fromMe:false id:"3ADFE22A2BBE6DB922DF"
	// 	>
	// message:<conversation:"Rapaz" >
	// messageTimestamp:1518121603

	// key:
	// 	<
	// 		remoteJid:"64212303774@s.whatsapp.net"
	// 		fromMe:false id:"3AE93457BA7D2FA708C9"
	// 	>
	// message:<conversation:"To lendo aqui sobre a parte de unit test" >
	// messageTimestamp:1518121615

	// key:
	// 	<
	// 		remoteJid:"64212303774@s.whatsapp.net"
	// 		fromMe:false id:"3AF410852E5467745C3E"
	// 	>
	// message:<conversation:"Pra go" >
	// messageTimestamp:1518121618

}
