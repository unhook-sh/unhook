import * as assert from 'node:assert';
import { suite, suiteTeardown, test } from 'mocha';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import {
  isDeliveryEnabled,
  isDeliveryPaused,
} from '../commands/delivery.commands';

// import * as myExtension from '../extension';

suite('Extension Test Suite', () => {
  suiteTeardown(() => {
    vscode.window.showInformationMessage('All tests done!');
  });

  test('Sample test', () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });

  test('Delivery setting should default to enabled', () => {
    // Test that delivery is enabled by default
    assert.strictEqual(isDeliveryEnabled(), true);
    assert.strictEqual(isDeliveryPaused(), false);
  });

  test('Delivery setting should be configurable', (done) => {
    const config = vscode.workspace.getConfiguration('unhook');

    // Set delivery to disabled
    config
      .update('delivery.enabled', false, vscode.ConfigurationTarget.Global)
      .then(() => {
        assert.strictEqual(isDeliveryEnabled(), false);
        assert.strictEqual(isDeliveryPaused(), true);

        // Set delivery back to enabled
        return config.update(
          'delivery.enabled',
          true,
          vscode.ConfigurationTarget.Global,
        );
      })
      .then(() => {
        assert.strictEqual(isDeliveryEnabled(), true);
        assert.strictEqual(isDeliveryPaused(), false);
        done();
      })
      .catch(done);
  });
});
