package services

import (
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
				wac, _, err := validConnection(ctx, params)
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
}
