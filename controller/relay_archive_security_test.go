package controller

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestRequestArchiveReadIsAnAllowedStepUpScope(t *testing.T) {
	assert.True(t, isAllowedSecurityProofScope(securityProofScopeRequestArchiveRead))
	assert.False(t, isAllowedSecurityProofScope("request_archive.write"))
}
