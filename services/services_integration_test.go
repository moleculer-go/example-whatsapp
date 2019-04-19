package services_test

import (
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"

	. "github.com/moleculer-go/example-whatsapp/services"
	"github.com/moleculer-go/moleculer"
	"github.com/moleculer-go/moleculer/broker"
)

var logLevel = "info"
var _ = Describe("Services", func() {

	bkr := broker.New(&moleculer.Config{
		DiscoverNodeID: func() string { return "node_services" },
		LogLevel:       logLevel,
	})
	Describe("Chat", func() {

		BeforeEach(func() {
			bkr.Publish(Chat)
			bkr.Start()
		})

		AfterEach(func() {
			bkr.Stop()
		})

		It("should list contacts", func() {
			//y5Z03am4MmN3
			//bkr.Call("")
			Expect(true).Should(BeTrue())
		})
	})
})
