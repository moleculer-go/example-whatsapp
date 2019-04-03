package services

import (
	"github.com/moleculer-go/moleculer"
)

var Chat = moleculer.Service{
	Name:    "chat",
	Actions: []moleculer.Action{
		// {
		// 	Name: "contacts",
		// 	Handler: func(ctx moleculer.Context, params moleculer.Payload) interface{} {
		// 		session := <-ctx.Call("concts.find", map[string]interface{}{
		// 			"query": map[string]interface{}{
		// 				"deviceToken": token,
		// 			},
		// 		})
		// 		if session.IsError() {
		// 			return nil, session.Error()
		// 		}

		// 		wac, _, err := validConnection(ctx, params)
		// 		if err != nil {
		// 			return payload.Error("Cannot list contacts! - error: ", err)
		// 		}

		// 		res, err := wac.Contacts()
		// 		if err != nil {
		// 			ctx.Logger().Error("Error trying to load contacts - error: ", err)
		// 			return payload.Error("Error trying to load contacts - error: ", err)
		// 		}

		// 		fmt.Println("Contacts() result.Attributes: ", res.Attributes)
		// 		fmt.Println("Contacts() result.Content: ", res.Content)
		// 		fmt.Println("Contacts() result.Description: ", res.Description)

		// 		return []map[string]interface{}{}
		// 	},
		// },
	},
}
