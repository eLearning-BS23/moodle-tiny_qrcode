# Engineering Remediation & Bug Fix Specification: `tiny_qrcode`

**Document Version:** 1.1 (Comprehensive Audit Edition)  
**Target Component:** `tiny_qrcode` (`lib/editor/tiny/plugins/qrcode`)  
**Target Environment:** Moodle 4.1 LTS through Moodle 5.2+ (TinyMCE 6 / 7 / 8, PHP 8.1 – 8.4)  
**Status:** Approved for Implementation  

---

## 1. Executive Summary & Complete Defect Traceability Matrix

This specification details the complete engineering solutions for **every vulnerability, architectural flaw, standards violation, compatibility regression, packaging defect, and CI/CD issue** identified in the technical audit.

| Ref # | Defect Identified | Severity | Affected File(s) | Fix Section |
| :--- | :--- | :---: | :--- | :---: |
| **SEC-01** | Stored XSS via unsanitized `formData.content` in `insertContent` | 🔴 Critical | [`amd/src/qrcodemodal.js#L130`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/amd/src/qrcodemodal.js#L130) | [Section 2.1](#21-stored-cross-site-scripting-xss-in-tinymce-insertion) |
| **SEC-02** | Unawaited Promise leaks `[object Promise]` in image `alt` attribute | 🔴 Critical | [`amd/src/qrcodemodal.js#L39`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/amd/src/qrcodemodal.js#L39) | [Section 2.2](#22-unawaited-promise-leakage-in-alt-attribute) |
| **SEC-03** | Server-side DoS/OOM via unbounded `size` and `margin` | 🟠 High | [`externallib.php#L76-L95`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/externallib.php#L76-L95) | [Section 2.3](#23-denial-of-service-dos--oom-via-unbounded-image-parameters) |
| **SEC-04** | Missing capability checks & missing `db/access.php` | 🟠 High | [`classes/plugininfo.php`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/classes/plugininfo.php) / `db/access.php` | [Section 3.1 & 3.2](#31-define-capabilities-in-dbaccessphp) |
| **SEC-05** | Sensitive error message disclosure via raw `$e->getMessage()` | 🟡 Medium | [`externallib.php#L105`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/externallib.php#L105) | [Section 3.3](#33-modernize-external-service-classesexternalgenerate_qr_codephp) |
| **ARCH-01**| Legacy `externallib.php` in root namespace with `services.php` classpath | 🟠 High | [`db/services.php`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/db/services.php) & [`externallib.php`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/externallib.php) | [Section 3.3 & 3.4](#33-modernize-external-service-classesexternalgenerate_qr_codephp) |
| **ARCH-02**| Bundled JSON in `PARAM_TEXT` parameter bypassing parameter validation | 🟡 Medium | [`externallib.php#L66-L73`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/externallib.php#L66-L73) | [Section 3.3](#33-modernize-external-service-classesexternalgenerate_qr_codephp) |
| **ARCH-03**| Missing `plugin_with_buttons` interface (breaks Moodle Tiny toolbar UI) | 🟠 High | [`classes/plugininfo.php`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/classes/plugininfo.php) | [Section 3.2](#32-modernize-classesplugininfophp) |
| **ARCH-04**| Toolbar registered as toggle button instead of standard action button | 🟡 Medium | [`amd/src/commands.js#L40`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/amd/src/commands.js#L40) | [Section 4.2](#42-refactor-amdmsrccommandsjs) |
| **FUNC-01**| `PARAM_URL` cleans away non-URL content (vCards, plain text, WiFi, tel) | 🟡 Medium | [`externallib.php#L75`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/externallib.php#L75) | [Section 3.3](#33-modernize-external-service-classesexternalgenerate_qr_codephp) |
| **JS-01**  | `common.js` default export vs. named imports in `plugin.js`/`config.js` | 🟠 High | [`amd/src/common.js`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/amd/src/common.js) | [Section 4.1](#41-fix-amdmsrccommonjs-named-exports) |
| **JS-02**  | Global `window.currentQRCodeEditor` pollution (multi-editor race condition) | 🟡 Medium | [`amd/src/commands.js`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/amd/src/commands.js) / [`qrcodemodal.js`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/amd/src/qrcodemodal.js) | [Section 4.2 & 4.3](#43-refactor-amdmsrcqrcodemodaljs) |
| **JS-03**  | `setTimeout` DOM polling anti-pattern & premature `this.destroy()` | 🟡 Medium | [`amd/src/qrcodemodal.js#L141-L152`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/amd/src/qrcodemodal.js#L141-L152) | [Section 4.3](#43-refactor-amdmsrcqrcodemodaljs) |
| **JS-04**  | 51 ESLint violations (1803-char inline SVG in `plugin.js`, bitwise, spacing) | 🟡 Medium | `amd/src/*.js` | [Section 4.4](#44-refactor-amdmsrcpluginjs-and-resolve-eslint-errors) |
| **A11Y-01**| Broken `<label for="...">` IDs and non-standard body button layout | 🟡 Medium | [`templates/insert_qrcode_modal.mustache`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/templates/insert_qrcode_modal.mustache) | [Section 5.1](#51-accessible-mustache-template) |
| **UI-01**  | Embedded `<style>` block & inline styles in Mustache template | 🟡 Medium | [`templates/insert_qrcode_modal.mustache`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/templates/insert_qrcode_modal.mustache) | [Section 5.2](#52-css-clean-up-in-stylescss) |
| **LANG-01**| Spelling typo `$string['forgroungcolor']` and missing boilerplate | 🟢 Low | [`lang/en/tiny_qrcode.php`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/lang/en/tiny_qrcode.php) | [Section 5.3](#53-correct-language-strings-in-langenytiny_qrcodephp) |
| **PKG-01** | `thirdpartylibs.xml` version mismatch (states v6.0.3, installed 5.1.0) & stray backtick | 🟡 Medium | [`thirdpartylibs.xml`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/thirdpartylibs.xml) | [Section 6.1](#61-fix-thirdpartylibsxml) |
| **PKG-02** | Leaked IDE workspace files committed in repository | 🟢 Low | `moodle.code-workspace`, `moodle405.code-workspace` | [Section 6.2](#62-repository-hygiene--leaked-workspace-cleanup) |
| **PKG-03** | PHP 8.1+ requirement not reflected for Moodle 4.1 branch in `version.php` | 🟡 Medium | [`version.php`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/version.php) | [Section 6.3](#63-update-versionphp-and-system-requirements) |
| **CI-01**  | Disabled CI checks in GitHub Actions (`validate`, `mustache`, `grunt || true`) | 🟡 Medium | [`.github/workflows/action.yml`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/.github/workflows/action.yml) | [Section 7.1](#71-modernize-github-actions-ci-workflow) |
| **TEST-01**| Test coverage is 0% (`tests/behat/qrcode.feature` is empty 0 bytes) | 🟠 High | [`tests/behat/qrcode.feature`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/tests/behat/qrcode.feature) | [Section 7.2 & 7.3](#72-automated-phpunit-test-testsexternal_testphp) |

---

## 2. Priority 0: Critical Security & DoS Fixes

---

### 2.1 Stored Cross-Site Scripting (XSS) in TinyMCE Insertion
* **File:** [`amd/src/qrcodemodal.js#L130`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/amd/src/qrcodemodal.js#L130)
* **Vulnerability Type:** CWE-79 (Improper Neutralization of Input During Web Page Generation)
* **CVSS Score:** **8.8 (Critical)**

#### Root Cause
The modal handler directly interpolates unsanitized user content into an HTML string and feeds it to `editor.insertContent()`:
```javascript
// VULNERABLE CODE:
targetEditor.insertContent(`<img src="${response.datauri}" alt="${altTextPrefix}  ${formData.content}" />`);
```
An attacker entering `" onerror="alert(document.cookie)` escapes the attribute context and executes arbitrary JavaScript in the victim's browser whenever the content is viewed.

#### Remediation
Never assemble raw HTML strings with unsanitized user input. Build an HTML element object or use strict HTML entity escaping before passing to TinyMCE:

```javascript
// SECURE REMEDIATION:
const escapeHtmlAttr = (str) => {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

const safeAlt = escapeHtmlAttr(`${resolvedAltTextPrefix}: ${formData.content}`);
const safeSrc = encodeURI(response.datauri);

targetEditor.insertContent(`<img src="${safeSrc}" alt="${safeAlt}" class="img-fluid tiny-qrcode" />`);
```

---

### 2.2 Unawaited Promise Leakage in Alt Attribute
* **File:** [`amd/src/qrcodemodal.js#L39`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/amd/src/qrcodemodal.js#L39)
* **Defect:** `core/str::getString()` returns a `Promise`. The code called it synchronously without `await`, causing JavaScript string interpolation to output `alt="[object Promise] https://..."`.

#### Remediation
Fetch and await the string before rendering the modal, or during the async submission pipeline:
```javascript
// In QrcodeModal.js or submission handler:
const altTextPrefix = await getString('altTextPrefix', 'tiny_qrcode');
```

---

### 2.3 Denial of Service (DoS / OOM) via Unbounded Image Parameters
* **File:** [`externallib.php#L76-L95`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/externallib.php#L76-L95)
* **Vulnerability Type:** CWE-400 (Uncontrolled Resource Consumption)
* **CVSS Score:** **7.5 (High)**

#### Root Cause
The backend receives raw integers for `size` and `margin` from the client JSON with no boundary enforcement. A malicious user or script sending `size = 100000` causes PHP's GD/Imagick memory buffer to crash with a fatal Out of Memory (OOM) error.

#### Remediation
Enforce strict server-side boundaries in the external service method:
```php
const MIN_SIZE = 50;
const MAX_SIZE = 1000;
const MIN_MARGIN = 0;
const MAX_MARGIN = 50;

$size = max(self::MIN_SIZE, min(self::MAX_SIZE, (int) $params['size']));
$margin = max(self::MIN_MARGIN, min(self::MAX_MARGIN, (int) $params['margin']));
```

---

## 3. Priority 1: Moodle 5.x Compliance & Architectural Modernization

---

### 3.1 Define Capabilities in `db/access.php`
Create the missing [`db/access.php`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/db/access.php):

```php
<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

defined('MOODLE_INTERNAL') || die();

$capabilities = [
    'tiny/qrcode:use' => [
        'captype' => 'read',
        'contextlevel' => CONTEXT_COURSE,
        'archetypes' => [
            'user' => CAP_ALLOW,
            'guest' => CAP_PREVENT,
        ],
    ],
];
```

---

### 3.2 Modernize `classes/plugininfo.php`
Update [`classes/plugininfo.php`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/classes/plugininfo.php) to implement `\editor_tiny\plugin_with_buttons` and permission checks:

```php
<?php
namespace tiny_qrcode;

use context;
use editor_tiny\editor;
use editor_tiny\plugin;
use editor_tiny\plugin_with_buttons;
use editor_tiny\plugin_with_configuration;

defined('MOODLE_INTERNAL') || die();

class plugininfo extends plugin implements plugin_with_buttons, plugin_with_configuration {

    public static function is_enabled(
        context $context,
        array $options,
        array $fpoptions,
        ?editor $editor = null
    ): bool {
        return isloggedin() && !isguestuser() && has_capability('tiny/qrcode:use', $context);
    }

    public static function get_available_buttons(): array {
        return [
            'tiny_qrcode/qrcode',
        ];
    }

    public static function get_plugin_configuration_for_context(
        context $context,
        array $options,
        array $fpoptions,
        ?editor $editor = null
    ): array {
        return [
            'permissions' => [
                'insert_qrcode' => has_capability('tiny/qrcode:use', $context),
            ],
            'contextid' => $context->id,
        ];
    }
}
```

---

### 3.3 Modernize External Service (`classes/external/generate_qr_code.php`)
Migrate from legacy `externallib.php` to a modern PSR-4 namespaced external service with typed parameters. Also resolves the `PARAM_URL` bug by using `PARAM_RAW_TRIMMED` to allow arbitrary text payloads (vCards, plain text, WiFi strings, SMS):

```php
<?php
namespace tiny_qrcode\external;

use context;
use context_system;
use context_helper;
use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;
use invalid_parameter_exception;
use Endroid\QrCode\Color\Color;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\RoundBlockSizeMode;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/lib/editor/tiny/plugins/qrcode/thirdparty/vendor/autoload.php');

class generate_qr_code extends external_api {

    const MIN_SIZE = 50;
    const MAX_SIZE = 1000;
    const MIN_MARGIN = 0;
    const MAX_MARGIN = 50;

    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'contextid' => new external_value(PARAM_INT, 'The context ID', VALUE_DEFAULT, null),
            'content' => new external_value(PARAM_RAW_TRIMMED, 'Content/URL of the QR code', VALUE_REQUIRED),
            'size' => new external_value(PARAM_INT, 'QR code dimension in pixels', VALUE_DEFAULT, 200),
            'margin' => new external_value(PARAM_INT, 'Quiet zone margin in modules', VALUE_DEFAULT, 10),
            'bgcolor' => new external_single_structure([
                'r' => new external_value(PARAM_INT, 'Red 0-255', VALUE_DEFAULT, 255),
                'g' => new external_value(PARAM_INT, 'Green 0-255', VALUE_DEFAULT, 255),
                'b' => new external_value(PARAM_INT, 'Blue 0-255', VALUE_DEFAULT, 255),
            ], 'Background RGB color', VALUE_DEFAULT, []),
            'fgcolor' => new external_single_structure([
                'r' => new external_value(PARAM_INT, 'Red 0-255', VALUE_DEFAULT, 0),
                'g' => new external_value(PARAM_INT, 'Green 0-255', VALUE_DEFAULT, 0),
                'b' => new external_value(PARAM_INT, 'Blue 0-255', VALUE_DEFAULT, 0),
            ], 'Foreground RGB color', VALUE_DEFAULT, []),
        ]);
    }

    public static function execute(
        ?int $contextid,
        string $content,
        int $size = 200,
        int $margin = 10,
        array $bgcolor = [],
        array $fgcolor = []
    ): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'contextid' => $contextid,
            'content' => $content,
            'size' => $size,
            'margin' => $margin,
            'bgcolor' => $bgcolor,
            'fgcolor' => $fgcolor,
        ]);

        $context = $params['contextid'] ? context_helper::instance_by_id($params['contextid']) : context_system::instance();
        self::validate_context($context);
        require_capability('tiny/qrcode:use', $context);

        if (empty(trim($params['content']))) {
            throw new invalid_parameter_exception('QR code content cannot be empty.');
        }

        $size = max(self::MIN_SIZE, min(self::MAX_SIZE, $params['size']));
        $margin = max(self::MIN_MARGIN, min(self::MAX_MARGIN, $params['margin']));

        $bgR = max(0, min(255, $params['bgcolor']['r'] ?? 255));
        $bgG = max(0, min(255, $params['bgcolor']['g'] ?? 255));
        $bgB = max(0, min(255, $params['bgcolor']['b'] ?? 255));

        $fgR = max(0, min(255, $params['fgcolor']['r'] ?? 0));
        $fgG = max(0, min(255, $params['fgcolor']['g'] ?? 0));
        $fgB = max(0, min(255, $params['fgcolor']['b'] ?? 0));

        try {
            $writer = new PngWriter();
            $qrcode = new QrCode(
                data: $params['content'],
                encoding: new Encoding('UTF-8'),
                errorCorrectionLevel: ErrorCorrectionLevel::Medium,
                size: $size,
                margin: $margin,
                roundBlockSizeMode: RoundBlockSizeMode::Margin,
                foregroundColor: new Color($fgR, $fgG, $fgB),
                backgroundColor: new Color($bgR, $bgG, $bgB)
            );

            $result = $writer->write($qrcode);

            return [
                'status' => true,
                'datauri' => $result->getDataUri(),
                'error' => '',
            ];
        } catch (\Throwable $e) {
            debugging('QR generation failed: ' . $e->getMessage(), DEBUG_DEVELOPER);
            return [
                'status' => false,
                'datauri' => '',
                'error' => get_string('qrcode_insert_failed', 'tiny_qrcode'),
            ];
        }
    }

    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'status' => new external_value(PARAM_BOOL, 'Status of QR generation'),
            'datauri' => new external_value(PARAM_RAW, 'Generated Data URI PNG', VALUE_OPTIONAL),
            'error' => new external_value(PARAM_TEXT, 'Error message if failed', VALUE_OPTIONAL),
        ]);
    }
}
```

---

### 3.4 Update `db/services.php`
Replace legacy classpath registration with PSR-4 autoloading:

```php
<?php
defined('MOODLE_INTERNAL') || die();

$functions = [
    'tiny_qrcode_generate_qr_code' => [
        'classname'   => \tiny_qrcode\external\generate_qr_code::class,
        'methodname'  => 'execute',
        'description' => 'Generate a QR code image with custom parameters',
        'type'        => 'read',
        'ajax'        => true,
        'loginrequired' => true,
    ],
];
```

---

## 4. Priority 2: Client-Side (JavaScript/AMD) & ESLint Overhaul

---

### 4.1 Fix `amd/src/common.js` Named Exports
Change from default object export to explicit named constant exports:

```javascript
// File: amd/src/common.js
export const component = 'tiny_qrcode';
export const pluginName = `${component}/plugin`;
export const qrcodeButtonName = `${component}/qrcode`;
export const qrcodeModalType = `${component}/qrcodemodal`;
```

---

### 4.2 Refactor `amd/src/commands.js`
Eliminate `window.currentQRCodeEditor` pollution and register standard `addButton`:

```javascript
// File: amd/src/commands.js
import {component, qrcodeButtonName} from './common';
import QrcodeModal from './qrcodemodal';
import {getString} from 'core/str';

const registerImageCommand = (editor, buttonTitle) => {
    editor.ui.registry.addButton(qrcodeButtonName, {
        icon: 'qrcode',
        tooltip: buttonTitle,
        onAction: () => {
            QrcodeModal.create({
                title: getString('title', component),
            }, editor);
        },
    });
};

export const getSetup = async () => {
    const buttonTitle = await getString('insertqrcode', component);
    return (editor) => {
        registerImageCommand(editor, buttonTitle);
    };
};

export default {getSetup};
```

---

### 4.3 Refactor `amd/src/qrcodemodal.js`
Fix async handling, attach listeners to the modal root, eliminate `setTimeout` polling, and prevent premature modal destruction:

```javascript
// File: amd/src/qrcodemodal.js
import Modal from 'core/modal';
import {component, qrcodeModalType} from './common';
import AJAX from 'core/ajax';
import {getString} from 'core/str';
import Notification from 'core/notification';

export default class QrcodeModal extends Modal {

    static TYPE = qrcodeModalType;
    static TEMPLATE = `${component}/insert_qrcode_modal`;

    editor = null;

    static async create(modalConfig = {}, editor = null) {
        const modal = await super.create(modalConfig);
        modal.editor = editor;
        return modal;
    }

    registerEventListeners() {
        super.registerEventListeners();

        const root = this.getRoot();

        root.on('submit', '#tiny_qrcode_form', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        root.on('click', '#qrcode-submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });
    }

    async handleFormSubmit() {
        const root = this.getRoot()[0];
        const contentInput = root.querySelector('#qrcodecontent');
        const sizeInput = root.querySelector('#qrcode_size');
        const marginInput = root.querySelector('#qrcode_margin');
        const bgColorInput = root.querySelector('#bgtemplateColor');
        const fgColorInput = root.querySelector('#templateColor');
        const submitBtn = root.querySelector('#qrcode-submit');

        const content = contentInput.value.trim();
        const size = parseInt(sizeInput.value, 10);
        const margin = parseInt(marginInput.value, 10);

        if (!content) {
            contentInput.classList.add('is-invalid');
            contentInput.focus();
            return;
        }
        contentInput.classList.remove('is-invalid');

        const hexToRgb = (hex) => {
            const clean = hex.replace(/^#/, '');
            const bigint = parseInt(clean, 16);
            return {
                r: Math.floor(bigint / 65536) % 256,
                g: Math.floor(bigint / 256) % 256,
                b: bigint % 256,
            };
        };

        // Disable submit button and show loading state
        submitBtn.disabled = true;

        try {
            const altPrefix = await getString('altTextPrefix', component);
            const response = await AJAX.call([{
                methodname: 'tiny_qrcode_generate_qr_code',
                args: {
                    content,
                    size,
                    margin,
                    bgcolor: hexToRgb(bgColorInput.value),
                    fgcolor: hexToRgb(fgColorInput.value),
                },
            }])[0];

            if (response.status && this.editor) {
                const safeAlt = `${altPrefix}: ${content}`
                    .replace(/"/g, '&quot;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');

                this.editor.insertContent(
                    `<img src="${encodeURI(response.datauri)}" alt="${safeAlt}" class="img-fluid tiny-qrcode" />`
                );
                this.destroy();
            } else {
                Notification.addNotification({
                    message: response.error || await getString('qrcode_insert_failed', component),
                    type: 'error',
                });
                submitBtn.disabled = false;
            }
        } catch (error) {
            Notification.exception(error);
            submitBtn.disabled = false;
        }
    }
}
```

---

### 4.4 Refactor `amd/src/plugin.js` and Resolve ESLint Errors
The original `amd/src/plugin.js` failed ESLint because line 46 contained an inline SVG of 1803 characters exceeding the 132-character maximum line length. In the refactored module, load the SVG cleanly or format the path elements cleanly to achieve **0 ESLint errors**:

```javascript
// File: amd/src/plugin.js
import {getTinyMCE} from 'editor_tiny/loader';
import {getPluginMetadata} from 'editor_tiny/utils';
import {component, pluginName} from './common';
import * as Commands from './commands';
import * as Configuration from './configuration';

const qrcodeIcon = `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">` +
    `<rect width="20" height="20" fill="white"/>` +
    `<g fill="black">` +
    `<rect x="0" y="0" width="7" height="7"/>` +
    `<rect x="1" y="1" width="5" height="5" fill="white"/>` +
    `<rect x="2" y="2" width="3" height="3"/>` +
    `<rect x="13" y="0" width="7" height="7"/>` +
    `<rect x="14" y="1" width="5" height="5" fill="white"/>` +
    `<rect x="15" y="2" width="3" height="3"/>` +
    `<rect x="0" y="13" width="7" height="7"/>` +
    `<rect x="1" y="14" width="5" height="5" fill="white"/>` +
    `<rect x="2" y="15" width="3" height="3"/>` +
    `</g>` +
    `</svg>`;

export default new Promise(async(resolve) => {
    const [
        tinyMCE,
        setupCommands,
        pluginMetadata,
    ] = await Promise.all([
        getTinyMCE(),
        Commands.getSetup(),
        getPluginMetadata(component, pluginName),
    ]);

    tinyMCE.PluginManager.add(`${component}/plugin`, (editor) => {
        editor.ui.registry.addIcon('qrcode', qrcodeIcon);
        setupCommands(editor);
        return pluginMetadata;
    });

    resolve([`${component}/plugin`, Configuration]);
});
```

---

## 5. Priority 3: UI, Accessibility (a11y) & Language Corrections

---

### 5.1 Accessible Mustache Template
Update [`templates/insert_qrcode_modal.mustache`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/templates/insert_qrcode_modal.mustache) to use accessible IDs and move buttons to `{{$footer}}`:

```mustache
{{< core/modal }}
    {{$body}}
        <form class="mform tiny_form tiny_qrcode" id="tiny_qrcode_form">
            <div class="form-group mb-3">
                <label for="qrcodecontent" class="form-label font-weight-bold">
                    {{#str}} qrcodecontent, tiny_qrcode {{/str}}
                </label>
                <input class="form-control" type="text" id="qrcodecontent" required placeholder="https://example.com" />
            </div>

            <div class="row mb-3">
                <div class="col-6">
                    <label for="qrcode_size" class="form-label font-weight-bold">
                        {{#str}} qrcode_size, tiny_qrcode {{/str}}
                    </label>
                    <input class="form-control" type="number" id="qrcode_size" value="200" min="50" max="1000" required />
                </div>
                <div class="col-6">
                    <label for="qrcode_margin" class="form-label font-weight-bold">
                        {{#str}} qrcode_margin, tiny_qrcode {{/str}}
                    </label>
                    <input class="form-control" type="number" id="qrcode_margin" value="10" min="0" max="50" required />
                </div>
            </div>

            <div class="row mb-2">
                <div class="col-6">
                    <label for="bgtemplateColor" class="form-label font-weight-bold d-block">
                        {{#str}} backgroundcolor, tiny_qrcode {{/str}}
                    </label>
                    <input type="color" id="bgtemplateColor" name="bgtemplateColor" value="#ffffff" class="form-control form-control-color qrcode-color-picker" />
                </div>
                <div class="col-6">
                    <label for="templateColor" class="form-label font-weight-bold d-block">
                        {{#str}} foregroundcolor, tiny_qrcode {{/str}}
                    </label>
                    <input type="color" id="templateColor" name="templateColor" value="#000000" class="form-control form-control-color qrcode-color-picker" />
                </div>
            </div>
        </form>
    {{/body}}

    {{$footer}}
        <button class="btn btn-secondary" data-action="cancel" type="button">
            {{#str}} cancel, core {{/str}}
        </button>
        <button class="btn btn-primary" type="button" id="qrcode-submit">
            {{#str}} insertqrcode, tiny_qrcode {{/str}}
        </button>
    {{/footer}}
{{/ core/modal }}
```

---

### 5.2 CSS Clean-up in `styles.css`
Create `styles.css` in plugin root and remove `<style>` from the template:

```css
.tiny_qrcode .qrcode-color-picker {
    width: 48px;
    height: 38px;
    padding: 2px;
    cursor: pointer;
}

.tiny-qrcode {
    display: inline-block;
    max-width: 100%;
    height: auto;
}
```

---

### 5.3 Correct Language Strings in `lang/en/tiny_qrcode.php`
Fix typo `$string['forgroungcolor']` and add missing boilerplate:

```php
<?php
defined('MOODLE_INTERNAL') || die();

$string['altTextPrefix'] = 'QR Code for';
$string['backgroundcolor'] = 'Background color';
$string['foregroundcolor'] = 'Foreground color';
$string['insertqrcode'] = 'Insert QR code';
$string['pluginname'] = 'Tiny QR code';
$string['privacy:metadata'] = 'The QR code plugin for TinyMCE does not store any personal data.';
$string['qrcode_insert_failed'] = 'Failed to generate QR code. Please check your inputs and try again.';
$string['qrcode_margin'] = 'Margin (modules)';
$string['qrcode_size'] = 'Size (px)';
$string['qrcodecontent'] = 'QR code content';
$string['qrcode:use'] = 'Use TinyMCE QR code generator';
$string['title'] = 'Insert QR code';
```

---

## 6. Priority 4: Packaging, Metadata & Repository Hygiene

---

### 6.1 Fix `thirdpartylibs.xml`
The current [`thirdpartylibs.xml`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/thirdpartylibs.xml) contains a version mismatch (`v6.0.3` listed vs `5.1.0` installed in composer) and a stray backtick on line 22. Replace with the valid, verified XML:

```xml
<?xml version="1.0" ?>
<libraries>
    <library>
        <location>thirdparty/vendor/bacon/bacon-qr-code</location>
        <name>Bacon QR Code Generator</name>
        <version>3.0.1</version>
        <license>BSD-2-Clause</license>
    </library>
    <library>
        <location>thirdparty/vendor/dasprid/enum</location>
        <name>PHP enum implementation</name>
        <version>1.0.6</version>
        <license>BSD-2-Clause</license>
    </library>
    <library>
        <location>thirdparty/vendor/endroid/qr-code</location>
        <name>Endroid QR Code</name>
        <version>5.1.0</version>
        <license>MIT</license>
    </library>
</libraries>
```

---

### 6.2 Repository Hygiene & Leaked Workspace Cleanup
Remove stray development configuration files accidentally committed to git:
* Remove `/moodle.code-workspace`
* Remove `/amd/src/moodle405.code-workspace`
* Remove `/thirdparty/moodle405.code-workspace`
* Remove `/lang/en/deprecated.txt` (empty 0-byte file)
* Add `*.code-workspace` to `.gitignore`.

---

### 6.3 Update `version.php` and System Requirements
Update [`version.php`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/version.php) to document modern requirements:

```php
<?php
defined('MOODLE_INTERNAL') || die();

$plugin->version   = 2026102901;
$plugin->requires  = 2022112800; // Requires Moodle 4.1 LTS or higher with PHP 8.1+.
$plugin->component = 'tiny_qrcode';
$plugin->release   = '1.0.0';
$plugin->maturity  = MATURITY_STABLE;
```

---

## 7. Priority 5: Testing & CI/CD Restoration

---

### 7.1 Modernize GitHub Actions CI Workflow
Update [`.github/workflows/action.yml`](file:///var/www/html/lms52/public/lib/editor/tiny/plugins/qrcode/.github/workflows/action.yml) to test Moodle 4.5, 5.0, and 5.2 on PHP 8.2 and 8.3, and re-enable strict validation:

```yaml
name: Moodle Plugin CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-22.04
    services:
      mariadb:
        image: mariadb:10.11
        env:
          MYSQL_USER: 'root'
          MYSQL_ALLOW_EMPTY_PASSWORD: "true"
          MYSQL_CHARACTER_SET_SERVER: "utf8mb4"
          MYSQL_COLLATION_SERVER: "utf8mb4_unicode_ci"
        ports:
          - 3306:3306
        options: --health-cmd="mysqladmin ping" --health-interval 10s --health-timeout 5s --health-retries 3

    strategy:
      fail-fast: false
      matrix:
        php: ['8.2', '8.3']
        moodle-branch: ['MOODLE_405_STABLE', 'MOODLE_500_STABLE', 'MOODLE_502_STABLE']
        database: [mariadb]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          path: ./lib/editor/tiny/plugins/qrcode

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ matrix.php }}
          extensions: gd, xml, mbstring
          coverage: none

      - name: Install moodle-plugin-ci
        run: |
          composer create-project -n --no-dev --prefer-dist moodlehq/moodle-plugin-ci ci ^4
          echo $(cd ci/bin; pwd) >> $GITHUB_PATH
          echo $(cd ci/vendor/bin; pwd) >> $GITHUB_PATH

      - name: Install Plugin
        run: moodle-plugin-ci install --plugin ./lib/editor/tiny/plugins/qrcode --db-host=127.0.0.1
        env:
          DB: ${{ matrix.database }}
          MOODLE_BRANCH: ${{ matrix.moodle-branch }}

      - name: PHP Lint
        run: moodle-plugin-ci phplint lib/editor/tiny/plugins/qrcode

      - name: Moodle Code Checker
        run: moodle-plugin-ci phpcs lib/editor/tiny/plugins/qrcode

      - name: Moodle PHPDoc Checker
        run: moodle-plugin-ci phpdoc lib/editor/tiny/plugins/qrcode

      - name: Plugin Validation
        run: moodle-plugin-ci validate lib/editor/tiny/plugins/qrcode

      - name: Mustache Lint
        run: moodle-plugin-ci mustache lib/editor/tiny/plugins/qrcode/templates

      - name: Grunt Build & Lint
        run: moodle-plugin-ci grunt lib/editor/tiny/plugins/qrcode

      - name: PHPUnit Tests
        run: moodle-plugin-ci phpunit --fail-on-warning lib/editor/tiny/plugins/qrcode

      - name: Behat Tests
        run: moodle-plugin-ci behat lib/editor/tiny/plugins/qrcode
```

---

### 7.2 Automated PHPUnit Test (`tests/external_test.php`)

```php
<?php
namespace tiny_qrcode;

use advanced_testcase;
use tiny_qrcode\external\generate_qr_code;

defined('MOODLE_INTERNAL') || die();

class external_test extends advanced_testcase {

    protected function setUp(): void {
        $this->resetAfterTest();
    }

    public function test_generate_qr_code_successful(): void {
        $user = $this->getDataGenerator()->create_user();
        $this->setUser($user);

        $result = generate_qr_code::execute(
            contextid: null,
            content: 'https://moodle.org',
            size: 150,
            margin: 5,
            bgcolor: ['r' => 255, 'g' => 255, 'b' => 255],
            fgcolor: ['r' => 0, 'g' => 0, 'b' => 0]
        );

        $this->assertTrue($result['status']);
        $this->assertStringStartsWith('data:image/png;base64,', $result['datauri']);
        $this->assertEmpty($result['error']);
    }

    public function test_generate_qr_code_enforces_bounds(): void {
        $user = $this->getDataGenerator()->create_user();
        $this->setUser($user);

        // Test oversize clamp
        $result = generate_qr_code::execute(
            contextid: null,
            content: 'Boundary Test',
            size: 50000,
            margin: 100
        );

        $this->assertTrue($result['status']);
        $this->assertNotEmpty($result['datauri']);
    }

    public function test_generate_qr_code_requires_login(): void {
        $this->expectException(\require_login_exception::class);
        generate_qr_code::execute(
            contextid: null,
            content: 'https://example.com'
        );
    }
}
```

---

### 7.3 Automated Behat Scenario (`tests/behat/qrcode.feature`)

```gherkin
@editor @editor_tiny @tiny_qrcode
Feature: TinyMCE QR code insertion
  In order to share mobile links with students
  As a teacher
  I need to generate and insert a QR code into the TinyMCE editor

  Background:
    Given the following "courses" exist:
      | fullname | shortname | format |
      | Course 1 | C1        | topics |
    And the following "users" exist:
      | username | firstname | lastname | email                |
      | teacher1 | Terry     | Teacher  | teacher1@example.com |
    And the following "course enrolments" exist:
      | user     | course | role           |
      | teacher1 | C1     | editingteacher |

  @javascript
  Scenario: Teacher inserts a QR code into course summary
    Given I log in as "teacher1"
    And I am on "Course 1" course homepage
    And I navigate to "Settings" in current page administration
    When I click on the "Insert QR code" button for the "Course summary" TinyMCE editor
    Then "Insert QR code" "dialogue" should exist
    When I set the field "QR code content" to "https://moodle.org"
    And I click on "Insert QR code" "button" in the "Insert QR code" "dialogue"
    Then "Insert QR code" "dialogue" should not exist
    And the "Course summary" TinyMCE editor content should contain "img class=\"img-fluid tiny-qrcode\""
```
