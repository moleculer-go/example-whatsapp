package services_test

import (
	"testing"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
)

func TestServicesIntegration(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Services Integration Test Suite")
}
