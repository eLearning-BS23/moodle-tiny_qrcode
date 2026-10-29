<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

namespace tiny_qrcode;

use context;
use editor_tiny\editor;
use editor_tiny\plugin;
use editor_tiny\plugin_with_buttons;
use editor_tiny\plugin_with_configuration;

/**
 * Tiny qrcode plugin info.
 *
 * @package    tiny_qrcode
 * @copyright  2024 Brain Station 23 Ltd. <brainstation-23.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class plugininfo extends plugin implements plugin_with_buttons, plugin_with_configuration {
    /**
     * Whether the plugin is enabled in this context.
     *
     * @param context $context
     * @param array $options
     * @param array $fpoptions
     * @param editor|null $editor
     * @return bool
     */
    public static function is_enabled(
        context $context,
        array $options,
        array $fpoptions,
        ?editor $editor = null
    ): bool {
        unset($options, $fpoptions, $editor);
        return isloggedin() && !isguestuser() && has_capability('tiny/qrcode:use', $context);
    }

    /**
     * Get list of available buttons for TinyMCE toolbar settings.
     *
     * @return array
     */
    public static function get_available_buttons(): array {
        return [
            'tiny_qrcode/qrcode',
        ];
    }

    /**
     * Retrieves the plugin configuration for a specific context.
     *
     * @param context $context The context in which the editor is used.
     * @param array $options The options passed in when requesting the editor.
     * @param array $fpoptions The file picker options passed in when requesting the editor.
     * @param editor|null $editor The editor instance in which the plugin is initialized (optional).
     * @return array The plugin configuration.
     */
    public static function get_plugin_configuration_for_context(
        context $context,
        array $options,
        array $fpoptions,
        ?editor $editor = null
    ): array {
        unset($options, $fpoptions, $editor);
        return [
            'permissions' => [
                'insert_qrcode' => has_capability('tiny/qrcode:use', $context),
            ],
            'contextid' => $context->id,
        ];
    }
}
