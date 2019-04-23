package main

import (
	"github.com/moleculer-go/example-whatsapp/services"
	"github.com/moleculer-go/moleculer"
	gateway "github.com/moleculer-go/moleculer-web"
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
	websocketMixin := &websocket.WebSocketMixin{
		Mixins: []websocket.SocketMixin{
			&websocket.EventsMixin{},
		},
	}

	cli.Start(
		&moleculer.Config{LogLevel: "inf"},
		func(broker *broker.ServiceBroker, cmd *cobra.Command) {
			gatewaySvc := &gateway.HttpService{
				Settings: getGatewayConfig(cmd),
				Mixins:   []gateway.GatewayMixin{websocketMixin},
			}
			broker.Publish(gatewaySvc, services.Login, services.Chat,
				services.Session, services.Contacts)
			broker.Start()
		})
}
