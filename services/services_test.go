package services

import (
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
)

var _ = Describe("Services", func() {

	Describe("Contacts", func() {
		It("contactType should recognized groups", func() {
			Expect(contactType("642102923972-1488714470@g.us")).Should(Equal("group"))
		})

		It("contactType should recognized person", func() {
			Expect(contactType("64221619450@s.whatsapp.net")).Should(Equal("person"))
		})

		It("contactType should not be recognized", func() {
			Expect(contactType("sdfsdfsdf")).Should(Equal("unknown"))
		})

		It("numberFromJid should return the number part of a jid", func() {
			Expect(numberFromJid("642102666276@s.whatsapp.net")).Should(Equal("642102666276"))
		})
	})

})
