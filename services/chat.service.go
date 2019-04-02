package services

import (
	"fmt"

	"github.com/moleculer-go/moleculer"
	"github.com/moleculer-go/moleculer/payload"
)

var Chat = moleculer.Service{
	Name: "chat",
	Actions: []moleculer.Action{
		{
			Name: "contacts",
			Handler: func(ctx moleculer.Context, params moleculer.Payload) interface{} {
				wac, _, err := validConnection(ctx, params)
				if err != nil {
					return payload.Error("Cannot list contacts! - error: ", err)
				}

				res, err := wac.Contacts()
				if err != nil {
					ctx.Logger().Error("Error trying to load contacts - error: ", err)
					return payload.Error("Error trying to load contacts - error: ", err)
				}

				fmt.Println("Contacts() result.Attributes: ", res.Attributes)
				fmt.Println("Contacts() result.Content: ", res.Content)
				fmt.Println("Contacts() result.Description: ", res.Description)

				return []map[string]interface{}{}
			},
		},
	},
}
