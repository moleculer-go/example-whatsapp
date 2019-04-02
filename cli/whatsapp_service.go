package main

import (
	"fmt"

	"github.com/moleculer-go/example-whatsapp/services"
	"github.com/moleculer-go/moleculer"
	gateway "github.com/moleculer-go/moleculer-web"
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
			broker.AddService(gateway.Service(getGatewayConfig(cmd)))
			broker.AddService(services.Login)
			broker.AddService(services.Chat)
			broker.AddService(services.Session)
			broker.AddService(services.Contacts)
			broker.Start()
		})
}
