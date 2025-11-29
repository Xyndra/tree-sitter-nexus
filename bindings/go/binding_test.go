package tree_sitter_nexus_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_nexus "github.com/xyndra/tree-sitter-nexus/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_nexus.Language())
	if language == nil {
		t.Errorf("Error loading Nexus grammar")
	}
}
