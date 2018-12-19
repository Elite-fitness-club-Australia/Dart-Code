import * as assert from "assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vs from "vscode";
import { dartCodeExtensionIdentifier } from "../../src/debug/utils";
import { FlutterCapabilities } from "../../src/flutter/capabilities";
import { DartUriHandler } from "../../src/uri_handlers/uri_handler";
import { FLUTTER_CREATE_PROJECT_TRIGGER_FILE } from "../../src/utils";
import { getChildFolders } from "../../src/utils/fs";
import { deleteDirectoryRecursive, sb } from "../helpers";
import sinon = require("sinon");

describe("URL handler", async () => {
	const urlHandler = new DartUriHandler(new FlutterCapabilities("1.0.0"));
	const tempPath = path.join(os.tmpdir(), dartCodeExtensionIdentifier, "flutter", "sample", "my.sample.id");
	beforeEach("clear out sample folder", () => deleteDirectoryRecursive(tempPath));
	afterEach("clear out sample folder", () => deleteDirectoryRecursive(tempPath));

	it("URL handler creates trigger file with sample ID in it", async () => {
		// Intercept executeCommand for openFolder so we don't spawn a new instance of Code!
		const executeCommand = sb.stub(vs.commands, "executeCommand");
		executeCommand.withArgs("vscode.openFolder", sinon.match.any).resolves();
		executeCommand.callThrough();

		await urlHandler.handleUri(vs.Uri.parse(`vscode://Dart-Code.dart-code/flutter/sample/my.sample.id`));

		// Expect a single folder, which is out sample app.
		const childFolders = getChildFolders(tempPath);
		assert.equal(childFolders.length, 1);

		const projectFolder = childFolders[0];
		const triggerFile = path.join(projectFolder, FLUTTER_CREATE_PROJECT_TRIGGER_FILE);
		assert.ok(fs.existsSync(triggerFile));
		assert.equal(fs.readFileSync(triggerFile).toString(), "my.sample.id");
	});

	it("Rejects sample IDs that do not conform", async () => {
		const showErrorMessage = sb.stub(vs.window, "showErrorMessage");

		await urlHandler.handleUri(vs.Uri.parse(`vscode://Dart-Code.dart-code/flutter/sample/my fake/sample`));

		assert(showErrorMessage.calledOnce);
	});
});
