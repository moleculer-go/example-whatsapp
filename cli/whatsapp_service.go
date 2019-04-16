package main

import (
	"fmt"

	"github.com/moleculer-go/example-whatsapp/services"
	"github.com/moleculer-go/moleculer"
	"github.com/moleculer-go/moleculer-web/websocket"
	"github.com/moleculer-go/moleculer/broker"
	"github.com/moleculer-go/moleculer/cli"
	"github.com/spf13/cobra"
)

func getGatewayConfig(cmd *cobra.Command) map[string]interface{} {
	env, _ := cmd.Flags().GetString("env")
	if env == "dev" {
		return map[string]interface{}{
			"reverseProxy": map[string]interface{}{
				"target": "http://localhost:3000",
			},
		}
	}
	return map[string]interface{}{}
}

func main() {
	cli.Start(
		&moleculer.Config{LogLevel: "debug"},
		func(broker *broker.ServiceBroker, cmd *cobra.Command) {
			fmt.Println("*** setup broker handler called !")

			broker.Publish(gateway.HttpService{
				Settings: getGatewayConfig(cmd),
				Mixins: []gateway.GatewayMixin{
					websocket.WebSocketMixin{},
					websocket.WebSocketEventsMixin{},
				},
			})

			broker.Publish(services.Login)
			broker.Publish(services.Chat)
			broker.Publish(services.Session)
			broker.Publish(services.Contacts)
			broker.Start()
		})
}
