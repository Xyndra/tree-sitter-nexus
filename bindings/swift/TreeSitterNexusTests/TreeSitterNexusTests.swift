import XCTest
import SwiftTreeSitter
import TreeSitterNexus

final class TreeSitterNexusTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_nexus())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Nexus grammar")
    }
}
